param(
  [string]$OutputPath = "public/assets/brand/topinfo-social-card.png"
)

Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$bitmap.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$black = [System.Drawing.ColorTranslator]::FromHtml("#080B0E")
$graphite = [System.Drawing.ColorTranslator]::FromHtml("#181E24")
$paper = [System.Drawing.ColorTranslator]::FromHtml("#F2F1EB")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#AEB6BF")
$lime = [System.Drawing.ColorTranslator]::FromHtml("#C7F45B")
$blue = [System.Drawing.ColorTranslator]::FromHtml("#0F62FE")

$graphics.Clear($black)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($graphite)), 72, 64, 1056, 502)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($lime)), 72, 64, 12, 502)

$logoBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$bluePen = New-Object System.Drawing.Pen($blue, 7)
$graphics.FillEllipse($logoBrush, 118, 102, 92, 92)
$graphics.DrawEllipse($bluePen, 118, 102, 92, 92)
$logoFont = New-Object System.Drawing.Font("Georgia", 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$logoFormat = New-Object System.Drawing.StringFormat
$logoFormat.Alignment = [System.Drawing.StringAlignment]::Center
$logoFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("T", $logoFont, (New-Object System.Drawing.SolidBrush($blue)), (New-Object System.Drawing.RectangleF(118, 98, 92, 96)), $logoFormat)

$brandFont = New-Object System.Drawing.Font("Malgun Gothic", 35, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("탑정보통신", $brandFont, (New-Object System.Drawing.SolidBrush($paper)), 236, 120)

$titleFont = New-Object System.Drawing.Font("Malgun Gothic", 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("매장의 흐름을`n설계합니다", $titleFont, (New-Object System.Drawing.SolidBrush($paper)), 118, 238)

$subFont = New-Object System.Drawing.Font("Malgun Gothic", 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("POS · 결제 · 인터넷 · 설치 · A/S", $subFont, (New-Object System.Drawing.SolidBrush($muted)), 122, 440)

$railPen = New-Object System.Drawing.Pen($lime, 4)
$graphics.DrawLine($railPen, 740, 210, 1040, 210)
$nodeBrush = New-Object System.Drawing.SolidBrush($lime)
foreach ($x in @(740, 840, 940, 1040)) {
  $graphics.FillEllipse($nodeBrush, $x - 7, 203, 14, 14)
}
$railLabelFont = New-Object System.Drawing.Font("Malgun Gothic", 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$labels = @("주문", "결제", "출력", "관리")
for ($i = 0; $i -lt $labels.Count; $i++) {
  $graphics.DrawString($labels[$i], $railLabelFont, (New-Object System.Drawing.SolidBrush($paper)), 718 + ($i * 100), 235)
}

$urlFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("topinfo.co.kr   031-487-4401", $urlFont, (New-Object System.Drawing.SolidBrush($muted)), 738, 508)

$resolved = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($resolved)) | Out-Null
$bitmap.Save($resolved, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()
Write-Output $resolved
