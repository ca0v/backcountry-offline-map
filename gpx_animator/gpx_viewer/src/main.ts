import '@maptiler/sdk/dist/maptiler-sdk.css';
import './style.css';
import { config, Map } from '@maptiler/sdk';

function readLocalStorage(name: string) {
  const value = localStorage.getItem(name);
  return value ? JSON.parse(value) : null;
}

function writeLocalStorage(name: string, value: any) {
  localStorage.setItem(name, JSON.stringify(value));
}

// if user presses "I", create an drag-and-drop zone that allows user to drop a file
// if user drops a file, read the file and display it on the map
// if user presses "I" again, remove the drag-and-drop zone
function setupRequestToImportFileHandler() {
  let hasDropZone = false;

  const onDrop = (e:DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    console.log('File dropped', file);
    // read the file and display it on the map
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('File content', e.target?.result);
    };
    reader.readAsText(file);
  };

  document.onkeydown = (e) => {
    if (e.key === 'i') {
      if (hasDropZone) {
        const dropZone = document.querySelector<HTMLDivElement>('.drop-zone');
        if (!dropZone) throw new Error('Drop zone not found');
        dropZone.removeEventListener('drop', onDrop);
        dropZone.remove();
        hasDropZone = false;
        return;
      }
      // create a drag-and-drop zone
      const dropZone = document.createElement('div');
      dropZone.classList.add('drop-zone');
      document.body.appendChild(dropZone);

      // initialize to allow user to drop files on this div
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      dropZone.addEventListener('drop', onDrop);

      hasDropZone = true;
    }
  }
}

function init() {
  const container = document.getElementById('app');

  if (!container) throw new Error('There is no div with the id: "map" ');

  let apiKey = readLocalStorage('maptiler_api_key');
  if (!apiKey) {
    apiKey = prompt('Please enter your MapTiler API key');
    if (!apiKey) throw new Error('No API key provided');
    writeLocalStorage('maptiler_api_key', apiKey);
  }

  config.apiKey = apiKey;
  const map = new Map({ container });

  console.log('The map instance', map);
  setupRequestToImportFileHandler();
}

init();