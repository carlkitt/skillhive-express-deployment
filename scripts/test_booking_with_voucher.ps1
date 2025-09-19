# Simple test script for booking with voucher
# Usage: .\test_booking_with_voucher.ps1 -ApiBase 'http://localhost:3000' -Token '<JWT>' -AvailableTimeId 7 -VoucherInventoryId 3
param(
  [string]$ApiBase = 'http://localhost:3000',
  [string]$Token = '',
  [int]$AvailableTimeId = 7,
  [int]$VoucherInventoryId = 3
)

if (-not $Token) {
  Write-Host "Please provide -Token '<JWT>'" -ForegroundColor Yellow
  exit 1
}

$headers = @{ Authorization = "Bearer $Token" }
$body = @{ available_time_id = $AvailableTimeId; voucher_inventory_id = $VoucherInventoryId } | ConvertTo-Json

Write-Host "POST $ApiBase/api/bookings with voucher_inventory_id=$VoucherInventoryId"
try {
  $resp = Invoke-RestMethod -Uri "$ApiBase/api/bookings" -Method Post -Body $body -ContentType 'application/json' -Headers $headers
  Write-Host "Response:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Host "Request failed:" -ForegroundColor Red
  Write-Host $_.Exception.Response.StatusCode.Value__
  $_.Exception.Response | Select-Object -ExpandProperty Content | Write-Host
}
