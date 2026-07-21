document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById('fileInput');
  const statusDiv = document.getElementById('status');
  const outputImage = document.getElementById('outputImage');

  const go = new Go();

  WebAssembly.instantiateStreaming(fetch('paa.wasm'), go.importObject)
    .then((result) => {
      go.run(result.instance).catch((err) => {
        statusDiv.innerText = 'error: ' + err;
      });

      fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        statusDiv.classList.remove('error');
        statusDiv.textContent = 'Converting...';
        outputImage.style.display = 'none';

        try {
          const result = paaToPng(new Uint8Array(await file.arrayBuffer()));

          if (!result.ok) {
            statusDiv.innerText = 'Conversion failed: ' + result.error;
            statusDiv.classList.add('error');
            return;
          }

          const blob = new Blob([result.png], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          outputImage.src = url;
          outputImage.style.display = 'block';
          statusDiv.textContent = 'Conversion complete!';
        } catch (error) {
          statusDiv.textContent = `Error: ${error.message}`;
          statusDiv.classList.add('error');
        }
      });

      statusDiv.innerText = 'Ready!';
      fileInput.disabled = false;
    })
    .catch((err) => {
      statusDiv.innerText = 'failed to load paa.wasm: ' + err;
      statusDiv.classList.add('error');
    });
});
