Write-Output "========================================"
Write-Output "  ISSUE 2: BROWSER REFRESH VERIFICATION"
Write-Output "========================================"

Write-Output "`n--- STEP 1: LOGIN ---"
$login = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"refresh@test.com","password":"refreshTest123"}' -UseBasicParsing
$loginBody = $login.Content | ConvertFrom-Json
$token = $loginBody.data.accessToken
Write-Output "STATUS: $($login.StatusCode)"
Write-Output "TOKEN: $($token.Substring(0,30))..."

Write-Output "`n--- STEP 2: GET WALLET (initial) ---"
$w1 = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet" -Method Get -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$w1Body = $w1.Content | ConvertFrom-Json
Write-Output "INITIAL: balance=$($w1Body.data.balance) version=$($w1Body.data.version)"

Write-Output "`n--- STEP 3: DEPOSIT 200 ---"
$dep = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet/deposit" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"amount":200,"description":"browser refresh deposit test"}' -UseBasicParsing
$depBody = $dep.Content | ConvertFrom-Json
Write-Output "STATUS: $($dep.StatusCode)"
Write-Output "DEPOSIT_RESULT: balance=$($depBody.data.balance) transactionId=$($depBody.data.transactionId)"

Write-Output "`n--- STEP 4: GET WALLET (after deposit, sim refresh) ---"
$w2 = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet" -Method Get -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$w2Body = $w2.Content | ConvertFrom-Json
Write-Output "AFTER_DEPOSIT_REFRESH: balance=$($w2Body.data.balance) version=$($w2Body.data.version)"

Write-Output "`n--- STEP 5: GET TRANSACTIONS ---"
$tx1 = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet/transactions" -Method Get -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$tx1Body = $tx1.Content | ConvertFrom-Json
Write-Output "TRANSACTION_COUNT: $($tx1Body.data.transactions.Count)"
foreach ($t in $tx1Body.data.transactions) {
  Write-Output "  type=$($t.type) amount=$($t.amount) before=$($t.balanceBefore) after=$($t.balanceAfter) desc=$($t.description)"
}

Write-Output "`n--- STEP 6: WITHDRAW 50 ---"
$wit = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet/withdraw" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"amount":50,"description":"browser refresh withdraw test"}' -UseBasicParsing
$witBody = $wit.Content | ConvertFrom-Json
Write-Output "STATUS: $($wit.StatusCode)"
Write-Output "WITHDRAW_RESULT: balance=$($witBody.data.balance) transactionId=$($witBody.data.transactionId)"

Write-Output "`n--- STEP 7: GET WALLET (after withdraw, sim refresh) ---"
$w3 = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet" -Method Get -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$w3Body = $w3.Content | ConvertFrom-Json
Write-Output "AFTER_WITHDRAW_REFRESH: balance=$($w3Body.data.balance) version=$($w3Body.data.version)"

Write-Output "`n--- STEP 8: GET TRANSACTIONS (final history) ---"
$tx2 = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/wallet/transactions" -Method Get -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$tx2Body = $tx2.Content | ConvertFrom-Json
Write-Output "TRANSACTION_COUNT: $($tx2Body.data.transactions.Count)"
foreach ($t in $tx2Body.data.transactions) {
  Write-Output "  type=$($t.type) amount=$($t.amount) before=$($t.balanceBefore) after=$($t.balanceAfter) desc=$($t.description)"
}

Write-Output "`n--- STEP 9: DB VERIFICATION ---"
$env:DATABASE_URL = "postgresql://ipl_user:ipl_password@localhost:5432/ipl_betting"
node ".refresh-db-verify.cjs" 2>&1

Write-Output "`n========================================"
Write-Output "  ISSUE 2 VERIFICATION COMPLETE"
Write-Output "========================================"
