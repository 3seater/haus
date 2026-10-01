$ErrorActionPreference = 'Stop'
$contractRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\contracts'))
$dockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$image = 'solanafoundation/anchor@sha256:21ab8a16e19df4301a198d7a55ab2988549aa2d996e6b5ad229c1d95b9f2d326'
& $dockerExe run --rm --name haus-vault-build --mount "type=bind,source=$contractRoot,target=/work" --mount 'type=volume,source=haus-cargo-cache,target=/root/.cargo/registry' --mount 'type=volume,source=haus-sbf-tools,target=/root/.cache/solana' -w /work $image cargo build-sbf --tools-version v1.52 --arch sbfv1 -- --locked
if ($LASTEXITCODE -ne 0) { throw 'Contract compilation failed' }
$artifact = Join-Path $contractRoot 'target\deploy\haus_vault.so'
$record = [ordered]@{
    image = $image
    platformTools = 'v1.52'
    architecture = 'sbfv1'
    sourceSha256 = (Get-FileHash -LiteralPath (Join-Path $contractRoot 'programs\haus-vault\src\lib.rs') -Algorithm SHA256).Hash.ToLowerInvariant()
    lockSha256 = (Get-FileHash -LiteralPath (Join-Path $contractRoot 'Cargo.lock') -Algorithm SHA256).Hash.ToLowerInvariant()
    binarySha256 = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
    binaryBytes = (Get-Item -LiteralPath $artifact).Length
    deployed = $false
}
$record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $contractRoot 'build-record.json')
$record | ConvertTo-Json
