# Thu nho anh bia: moi novels/<sach>/cover.jpg rong hon 600 diem anh se duoc thu ve rong 600
# (giu ty le), luu JPEG chat luong 85, ghi de file cu. Anh da nho thi bo qua.
# Chay bang: npm run covers   (dung san cong cu cua Windows, khong can cai them gi)

Add-Type -AssemblyName System.Drawing

$maxWidth = 600
$quality = 85
$root = Split-Path -Parent $PSScriptRoot

# Bo ma hoa JPEG va muc chat luong
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

foreach ($file in Get-ChildItem (Join-Path $root 'novels\*\cover.jpg')) {
  # Doc anh vao bo nho truoc, de co the ghi de chinh file do
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  $stream = New-Object System.IO.MemoryStream (, $bytes)
  $image = [System.Drawing.Image]::FromStream($stream)

  if ($image.Width -le $maxWidth) {
    Write-Output "$($file.Directory.Name): da nho ($($image.Width) px), bo qua"
    $image.Dispose(); $stream.Dispose()
    continue
  }

  $height = [int][math]::Round($image.Height * $maxWidth / $image.Width)
  $small = New-Object System.Drawing.Bitmap $maxWidth, $height
  $g = [System.Drawing.Graphics]::FromImage($small)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($image, 0, 0, $maxWidth, $height)
  $g.Dispose(); $image.Dispose(); $stream.Dispose()

  $before = [math]::Round($file.Length / 1KB)
  $small.Save($file.FullName, $jpeg, $params)
  $small.Dispose()
  $after = [math]::Round((Get-Item $file.FullName).Length / 1KB)
  Write-Output "$($file.Directory.Name): $before KB -> $after KB ($maxWidth x $height)"
}
