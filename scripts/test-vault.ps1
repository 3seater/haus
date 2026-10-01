$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$dockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$image = 'solanafoundation/anchor@sha256:21ab8a16e19df4301a198d7a55ab2988549aa2d996e6b5ad229c1d95b9f2d326'
$containerName = 'haus-vault-integration'
$created = $false
Push-Location $projectRoot
try {
    node node_modules/typescript/bin/tsc -p tsconfig.integration.json
    if ($LASTEXITCODE -ne 0) { throw 'Integration compilation failed' }
    $programRoot = Join-Path $projectRoot 'contracts\target\deploy'
    if (!(Test-Path -LiteralPath (Join-Path $programRoot 'haus_vault.so'))) { throw 'Build the vault first' }
    & $dockerExe run -d --rm --name $containerName -p 127.0.0.1:8897:8899 -p 127.0.0.1:8898:8900 --mount "type=bind,source=$programRoot,target=/programs,readonly" $image solana-test-validator --ledger /tmp/haus-ledger --upgradeable-program FBVrAjsfxzA6ENq2vaf7Szwzj213uLsHMidYh6SRTu75 /programs/haus_vault.so 7e5pxK83ceXb2iWXBizF1U8MdL7C5VcVBBXpDWaYo3x1 --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Local validator did not start; check that ports 8897 and 8898 are free' }
    $created = $true
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try {
            $result = Invoke-RestMethod -Uri 'http://127.0.0.1:8897' -Method Post -ContentType 'application/json' -Body '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' -TimeoutSec 2
            if ($result.result -eq 'ok') { $ready = $true; break }
        } catch { }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw 'Local validator health check failed' }
    node .worker-build/scripts/vault-integration.js
    if ($LASTEXITCODE -ne 0) { throw 'Contract integration checks failed' }
} finally {
    if ($created) { & $dockerExe stop $containerName | Out-Null }
    Pop-Location
}
