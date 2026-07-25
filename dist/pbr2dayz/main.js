const $baseColor = document.getElementById('baseColor');
const $normal = document.getElementById('normal');
const $metallic = document.getElementById('metallic');
const $roughness = document.getElementById('roughness');
const $ao = document.getElementById('ao');

const $co = document.getElementById('co');
const $nohq = document.getElementById('nohq');
const $as = document.getElementById('as');
const $smdi = document.getElementById('smdi');

const $statusDiv = document.getElementById('status');
const $convertButton = document.getElementById('convertButton');
const $downloadButton = document.getElementById('downloadButton');

let baseName = '';
let isWorkerReady = false;
let isConverting = false;

function checkReady() {
  const filesSelected = $baseColor.files.length > 0 && $normal.files.length > 0;
  $convertButton.disabled = !(isWorkerReady && filesSelected && !isConverting);
  $downloadButton.disabled = !(isWorkerReady && !isConverting && !!$co.src);
}

const worker = new Worker('worker.js');

worker.onerror = (event) => {
  isConverting = false;
  checkReady();
  $statusDiv.innerText = 'worker error: ' + event.message;
};

worker.onmessage = (event) => {
  const message = event.data;

  if (message.type === 'ready') {
    isWorkerReady = true;
    checkReady();
    $statusDiv.innerText = 'Ready!';
    return;
  }

  if (message.type === 'error') {
    isConverting = false;
    checkReady();
    $statusDiv.innerText = message.error;
    return;
  }

  if (message.type === 'result') {
    isConverting = false;
    checkReady();

    if (!message.ok) {
      $statusDiv.innerText = 'Conversion failed: ' + message.error;
      return;
    }

    $co.src = URL.createObjectURL(new Blob([message.co], { type: 'image/png' }));
    $co.style.display = 'block';

    $nohq.src = URL.createObjectURL(new Blob([message.nohq], { type: 'image/png' }));
    $nohq.style.display = 'block';

    $as.src = URL.createObjectURL(new Blob([message.as], { type: 'image/png' }));
    $as.style.display = 'block';

    $smdi.src = URL.createObjectURL(new Blob([message.smdi], { type: 'image/png' }));
    $smdi.style.display = 'block';

    $statusDiv.textContent = 'Conversion complete!';

    checkReady();
  }
};

$baseColor.addEventListener('change', checkReady);
$normal.addEventListener('change', checkReady);

$convertButton.addEventListener('click', async () => {
  const baseColorFile = $baseColor.files[0];
  const normalFile = $normal.files[0];
  const metallicFile = $metallic.files[0] || null;
  const roughnessFile = $roughness.files[0] || null;
  const aoFile = $ao.files[0] || null;

  isConverting = true;
  checkReady();
  $statusDiv.textContent = 'Converting...';

  $co.style.display = 'none';
  $nohq.style.display = 'none';
  $as.style.display = 'none';
  $smdi.style.display = 'none';

  try {
    const baseColor = await baseColorFile.arrayBuffer();
    const normal = await normalFile.arrayBuffer();
    const metallic = metallicFile ? await metallicFile.arrayBuffer() : null;
    const roughness = roughnessFile ? await roughnessFile.arrayBuffer() : null;
    const ao = aoFile ? await aoFile.arrayBuffer() : null;

    baseName = (baseColorFile.name.split('.').slice(0, -1).join('.')).split('_')[0].split(' ')[0];

    const transferList = [baseColor, normal, metallic, roughness, ao].filter(Boolean);

    worker.postMessage({ type: 'convert', baseColor, normal, metallic, roughness, ao }, transferList);
  } catch (error) {
    isConverting = false;
    checkReady();
    $statusDiv.textContent = `Error: ${error.message}`;
  }
});

$downloadButton.addEventListener('click', () => {
  downloadUrlSrc(baseName + '_co.png', $co.src);
  downloadUrlSrc(baseName + '_nohq.png', $nohq.src);
  downloadUrlSrc(baseName + '_as.png', $as.src);
  downloadUrlSrc(baseName + '_smdi.png', $smdi.src);
})

function downloadUrlSrc(filename, src) {
  const a = document.createElement('a');
  a.href = src;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
