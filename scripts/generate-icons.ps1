# Menghasilkan ikon geometris dari bentuk biji kopi, tanpa paket tambahan.
Add-Type -AssemblyName System.Drawing
$iconDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public/icons'))
New-Item -ItemType Directory -Force -Path $iconDirectory | Out-Null
$sizes = @(@{Name='icon-192.png'; Size=192}, @{Name='icon-512.png'; Size=512}, @{Name='maskable-512.png'; Size=512}, @{Name='apple-touch-icon.png'; Size=180})
foreach ($item in $sizes) {
  $bitmap = New-Object System.Drawing.Bitmap($item.Size, $item.Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#1f6b4f'))
  $scale = $item.Size / 512.0
  $graphics.ScaleTransform($scale, $scale)
  $graphics.TranslateTransform(256, 256)
  $graphics.RotateTransform(35)
  $beanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#fbefd8'))
  $graphics.FillEllipse($beanBrush, -110, -160, 220, 320)
  $groove = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#1f6b4f'), 24)
  $groove.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $groove.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawBezier($groove, 0, -150, -81, -50, 81, 50, 0, 150)
  $bitmap.Save((Join-Path $iconDirectory $item.Name), [System.Drawing.Imaging.ImageFormat]::Png)
  $groove.Dispose()
  $beanBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
