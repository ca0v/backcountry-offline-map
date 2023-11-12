import '@maptiler/sdk/dist/maptiler-sdk.css';
import './style.css';
import { config, Map } from '@maptiler/sdk';

function init() {
  const container = document.getElementById('app');

  if (!container) throw new Error('There is no div with the id: "map" ');

  config.apiKey = 'f0zkb15NK1sqOcE72HCf';
  const map = new Map({ container });

  console.log('The map instance', map);
}

init();