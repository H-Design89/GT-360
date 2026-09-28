$content = Get-Content -Path "script.js" -Raw -Encoding UTF8

$regex1 = "document\.getElementById\('tbStartDate'\)\.value = parseD\(order\['Ngày tạo'\]\)"
$replacement1 = "document.getElementById('tbStartDate').value = parseD(order['Ngày bắt đầu'])"

$regex2 = "document\.getElementById\('tbEndDate'\)\.value = parseD\(order\['Ngày giao hàng'\]\)"
$replacement2 = "document.getElementById('tbEndDate').value = parseD(order['Ngày kết thúc'])"

$content = $content -replace $regex1, $replacement1
$content = $content -replace $regex2, $replacement2

Set-Content -Path "script.js" -Value $content -NoNewline -Encoding UTF8
