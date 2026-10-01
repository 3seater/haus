Add-Type -AssemblyName System.Drawing
$labels=@('WE ARE','THE DEVS.','BUILT BY US.','HAUS','haus','YOUR COIN.','OUR HAUS.','HOLDERS','BUILD HERE.','A HOME FOR EVERY COIN.','THE COMMUNITY LAUNCHPAD','HAUS.FUN','01','02','03','04','05','EST. 2026','LAUNCH. BUILD. BELONG.','IN GOOD COMPANY.','MADE OF US.')
$result=[System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
foreach($label in $labels){
  $familyName=if($label -eq 'haus'){'Arial'}else{'Impact'}
  $style=if($label -eq 'haus'){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Regular}
  $family=[System.Drawing.FontFamily]::new($familyName)
  $shape=[System.Drawing.Drawing2D.GraphicsPath]::new()
  $shape.AddString($label,$family,[int]$style,1000,[System.Drawing.PointF]::new(0,0),[System.Drawing.StringFormat]::GenericTypographic)
  $bounds=$shape.GetBounds();$points=$shape.PathPoints;$types=$shape.PathTypes;$parts=[System.Collections.Generic.List[string]]::new()
  function Pt($p){return $p.X.ToString('0.###',[Globalization.CultureInfo]::InvariantCulture)+','+$p.Y.ToString('0.###',[Globalization.CultureInfo]::InvariantCulture)}
  for($i=0;$i -lt $points.Length;$i++){
    $kind=$types[$i] -band 7
    if($kind -eq 0){$parts.Add('M'+(Pt $points[$i]))}
    elseif($kind -eq 1){$parts.Add('L'+(Pt $points[$i]))}
    elseif($kind -eq 3){$parts.Add('C'+(Pt $points[$i])+' '+(Pt $points[$i+1])+' '+(Pt $points[$i+2]));$i+=2}
    if($types[$i] -band 128){$parts.Add('Z')}
  }
  $result[$label]=@{d=($parts -join '');x=$bounds.X;y=$bounds.Y;width=$bounds.Width;height=$bounds.Height}
  $shape.Dispose();$family.Dispose()
}
$result | ConvertTo-Json -Depth 4 -Compress | Set-Content -LiteralPath scripts/brand-kit/lettering.json -Encoding utf8
