function Write-JsonFile($path, $obj) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Compress), $utf8NoBom)
}

function Login($email, $pass) {
  Write-JsonFile "$env:TEMP\_login.json" @{ email = $email; password = $pass }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" -d @$env:TEMP\_login.json
  $obj = $r | ConvertFrom-Json
  if ($obj.success) { return $obj.data.accessToken }
  return $null
}

Write-Host "================================================"
Write-Host "HIERARCHY INTEGRITY AUDIT"
Write-Host "================================================"

# Login as admin
$adminToken = Login "admin@ipl.com" "admin123"
if ($adminToken) { Write-Host "`nAdmin Login: OK" } else { Write-Host "`nAdmin Login: FAIL" }

# === TEST 1: Admin creates Master ===
Write-Host "`n[TEST 1] Admin creates Master (should PASS - 201) ---"
Write-JsonFile "$env:TEMP\_cm.json" @{
  email = "master1@test.com"
  username = "master1"
  password = "MasterPass123!"
  displayName = "Master One"
  commissionRate = 5.0
  creditLimit = 50000
  exposureLimit = 100000
  maxPlayerCount = 50
}
$r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/masters -H "Authorization: Bearer $adminToken" -H "Content-Type: application/json" -d @$env:TEMP\_cm.json
$rObj = $r | ConvertFrom-Json
if ($rObj.success) { Write-Host "  Status: 201 (PASS)" } else { Write-Host "  Status: FAIL - $r" }
Write-Host "  Response: $r"
$masterUserId = $rObj.data.id
$masterHierarchyData = $rObj.data.hierarchy

# Login as master
$masterToken = Login "master1@test.com" "MasterPass123!"
if ($masterToken) { Write-Host "  Master login: OK" } else { Write-Host "  Master login: FAIL" }

# === TEST 2: Master creates Agent ===
Write-Host "`n[TEST 2] Master creates Agent (should PASS - 201) ---"
if ($masterToken) {
  Write-JsonFile "$env:TEMP\_ca.json" @{
    email = "agent1@test.com"
    username = "agent1"
    password = "AgentPass123!"
    displayName = "Agent One"
    commissionRate = 3.0
    creditLimit = 10000
    exposureLimit = 50000
    maxPlayerCount = 100
  }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/agents -H "Authorization: Bearer $masterToken" -H "Content-Type: application/json" -d @$env:TEMP\_ca.json
  $rObj = $r | ConvertFrom-Json
  if ($rObj.success) { Write-Host "  Status: 201 (PASS)" } else { Write-Host "  Status: FAIL - $r" }
  Write-Host "  Response: $r"
  $agentUserId = $rObj.data.id
  $agentHierarchyData = $rObj.data.hierarchy
} else { Write-Host "  SKIP: no master token" }

$agentToken = Login "agent1@test.com" "AgentPass123!"
if ($agentToken) { Write-Host "  Agent login: OK" } else { Write-Host "  Agent login: FAIL" }

# === TEST 3: Agent creates Player ===
Write-Host "`n[TEST 3] Agent creates Player (should PASS - 201) ---"
if ($agentToken) {
  Write-JsonFile "$env:TEMP\_cp.json" @{
    email = "player1@test.com"
    username = "player1"
    password = "PlayerPass123!"
    displayName = "Player One"
  }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/players -H "Authorization: Bearer $agentToken" -H "Content-Type: application/json" -d @$env:TEMP\_cp.json
  $rObj = $r | ConvertFrom-Json
  if ($rObj.success) { Write-Host "  Status: 201 (PASS)" } else { Write-Host "  Status: FAIL - $r" }
  Write-Host "  Response: $r"
} else { Write-Host "  SKIP: no agent token" }

$playerToken = Login "player1@test.com" "PlayerPass123!"
if ($playerToken) { Write-Host "  Player login: OK" } else { Write-Host "  Player login: FAIL" }

# === TEST 4: Player tries forbidden actions (should FAIL - 403) ===
Write-Host "`n[TEST 4] Player creates user (should FAIL - 403) ---"
if ($playerToken) {
  Write-JsonFile "$env:TEMP\_f1.json" @{ email = "x@x.com"; username = "x"; password = "Xxxxx123!" }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/masters -H "Authorization: Bearer $playerToken" -H "Content-Type: application/json" -d @$env:TEMP\_f1.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  4a. Create Master as Player: 403 (PASS)" } else { Write-Host "  4a. Create Master as Player: $code (FAIL - expected 403)" }
  Write-Host "    Response: $r"

  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/agents -H "Authorization: Bearer $playerToken" -H "Content-Type: application/json" -d @$env:TEMP\_f1.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  4b. Create Agent as Player: 403 (PASS)" } else { Write-Host "  4b. Create Agent as Player: $code (FAIL - expected 403)" }
  Write-Host "    Response: $r"

  Write-JsonFile "$env:TEMP\_f2.json" @{ email = "y@y.com"; username = "y2"; password = "Yyyyy123!"; displayName = "y" }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/players -H "Authorization: Bearer $playerToken" -H "Content-Type: application/json" -d @$env:TEMP\_f2.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  4c. Create Player as Player: 403 (PASS)" } else { Write-Host "  4c. Create Player as Player: $code (FAIL - expected 403)" }
  Write-Host "    Response: $r"
} else { Write-Host "  SKIP: no player token" }

# === TEST 5: Agent creates Master (should FAIL - 403) ===
Write-Host "`n[TEST 5] Agent creates Master (should FAIL - 403) ---"
if ($agentToken) {
  Write-JsonFile "$env:TEMP\_f3.json" @{ email="agmaster@x.com"; username="agmaster"; password="Xxxxx123!" }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/masters -H "Authorization: Bearer $agentToken" -H "Content-Type: application/json" -d @$env:TEMP\_f3.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  Status: 403 (PASS)" } else { Write-Host "  Status: $code (FAIL - expected 403)" }
  Write-Host "  Response: $r"
} else { Write-Host "  SKIP: no agent token" }

# === TEST 6: Master tries admin actions (should FAIL - 403) ===
Write-Host "`n[TEST 6] Master does admin actions (should FAIL - 403) ---"
if ($masterToken) {
  Write-JsonFile "$env:TEMP\_f4.json" @{ commissionRate = 10 }
  $r = curl.exe -s -X PATCH "http://localhost:4000/api/v1/hierarchy/users/$masterUserId/commission" -H "Authorization: Bearer $masterToken" -H "Content-Type: application/json" -d @$env:TEMP\_f4.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  Patch commission: 403 (PASS)" } else { Write-Host "  Patch commission: $code (FAIL - expected 403)" }
  Write-Host "    Response: $r"

  Write-JsonFile "$env:TEMP\_f5.json" @{ isActive = $false }
  $r = curl.exe -s -X PATCH "http://localhost:4000/api/v1/hierarchy/users/00000000-0000-0000-0000-000000000000/status" -H "Authorization: Bearer $masterToken" -H "Content-Type: application/json" -d @$env:TEMP\_f5.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  Toggle status: 403 (PASS)" } else { Write-Host "  Toggle status: $code (FAIL - expected 403)" }
  Write-Host "    Response: $r"

  Write-JsonFile "$env:TEMP\_f6.json" @{ email="mm@x.com"; username="mm"; password="Xxxxx123!" }
  $r = curl.exe -s -X POST http://localhost:4000/api/v1/hierarchy/masters -H "Authorization: Bearer $masterToken" -H "Content-Type: application/json" -d @$env:TEMP\_f6.json
  $code = ($r | ConvertFrom-Json).statusCode
  if ($code -eq 403) { Write-Host "  Create Master: 403 (PASS)" } else { Write-Host "  Create Master: $code (FAIL - expected 403)" }
  Write-Host "    Response: $r"
} else { Write-Host "  SKIP: no master token" }

Write-Host "`n================================================"
Write-Host "API TESTS COMPLETE"
Write-Host "Running database verification"
Write-Host "================================================"
