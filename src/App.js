import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import JSZip from 'jszip'; // Biblioteca para compactar o arquivo KMZ
import { saveAs } from 'file-saver'; // Biblioteca para salvar o arquivo localmente
import 'leaflet/dist/leaflet.css';
import './App.css';

// Ícones personalizados
const redIcon = new L.Icon({
  iconUrl: require('./assets/images/marker-icon-red.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: require('./assets/images/marker-icon-blue.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  shadowSize: [41, 41],
});

const yellowIcon = new L.Icon({
  iconUrl: require('./assets/images/marker-icon-yellow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  shadowSize: [41, 41],
});

function App() {
  const [kmzFiles, setKmzFiles] = useState([]); // Estado para armazenar os KMZs criados
  const [searchTerm, setSearchTerm] = useState(''); // Estado para armazenar o termo de busca

  useEffect(() => {
    axios.get('http://localhost:5000/')
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Erro ao conectar com o backend:', error);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>CRIE SEU KMZ</h1>
      </header>
      <main className="App-main">
        <Mapa setKmzFiles={setKmzFiles} kmzFiles={kmzFiles} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </main>
    </div>
  );
}

function Mapa({ setKmzFiles, kmzFiles, searchTerm, setSearchTerm }) {
  const [markers, setMarkers] = useState([]);
  const [route, setRoute] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMarker, setSelectedMarker] = useState('');

  const selectMarker = (type) => {
    setSelectedMarker(type);
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const newMarker = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          type: selectedMarker,
          name: selectedMarker === 'yellow' ? '' : selectedMarker === 'red' ? 'Caixas de Emenda' : 'POP',
        };
        setMarkers([...markers, newMarker]);
        setRoute([...route, [e.latlng.lat, e.latlng.lng]]);
      },
    });
    return null;
  };

  const removeLastMarker = () => {
    if (markers.length === 0) return;
    const updatedMarkers = markers.slice(0, -1);
    const updatedRoute = route.slice(0, -1);
    setMarkers(updatedMarkers);
    setRoute(updatedRoute);
  };

  const clearAllMarkers = () => {
    setMarkers([]);
    setRoute([]);
  };

  const updateMarkerName = (index, value) => {
    const updatedMarkers = [...markers];
    updatedMarkers[index].name = value;
    setMarkers(updatedMarkers);
  };

  const generateKML = () => {
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>
        <name>${name}</name>
        <description>${description}</description>
        <Style id="red">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
            </Icon>
          </IconStyle>
        </Style>
        <Style id="blue">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href>
            </Icon>
          </IconStyle>
        </Style>
        <Style id="yellow">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png</href>
            </Icon>
          </IconStyle>
        </Style>
        <Style id="routeStyle">
          <LineStyle>
            <color>ff0000ff</color>
            <width>3</width>
          </LineStyle>
        </Style>`;

    markers.forEach(marker => {
      kmlContent += `
      <Placemark>
        <name>${marker.name || 'Sem nome'}</name>
        <styleUrl>#${marker.type}</styleUrl>
        <Point>
          <coordinates>${marker.lng},${marker.lat},0</coordinates>
        </Point>
      </Placemark>`;
    });

    if (route.length > 0) {
      kmlContent += `
      <Placemark>
        <name>Rota</name>
        <styleUrl>#routeStyle</styleUrl>
        <LineString>
          <coordinates>
            ${route.map(point => `${point[1]},${point[0]},0`).join(' ')}
          </coordinates>
        </LineString>
      </Placemark>`;
    }

    kmlContent += `</Document></kml>`;
    return kmlContent;
  };

  const saveAsKMZ = () => {
    const kmlContent = generateKML();
    const zip = new JSZip();
    zip.file("map.kml", kmlContent);
    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, `${name}.kmz`);

      const newKMZ = {
        name: name || 'Sem nome',
        description: description || 'Sem descrição',
        date: new Date().toLocaleString(),
        file: content,
      };

      setKmzFiles(prevKmzFiles => [...prevKmzFiles, newKMZ]);

      setMarkers([]);
      setRoute([]);
      setName('');
      setDescription('');
    });
  };

  const downloadKMZ = (file, name) => {
    saveAs(file, `${name}.kmz`);
  };

  const filteredKMZs = kmzFiles.filter(kmz => 
    kmz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kmz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="map-container">
      <div className="marker-selection">
        <h3>Selecione seu marcador</h3>
        <div className="button-group">
          <button onClick={() => selectMarker('red')} className="button red-button"></button>
          <button onClick={() => selectMarker('blue')} className="button blue-button"></button>
          <button onClick={() => selectMarker('yellow')} className="button yellow-button"></button>
        </div>
        <div className="marker-actions">
          <button onClick={removeLastMarker} className="button-clean">Remover Último Marcador</button>
          <button onClick={clearAllMarkers} className="button-clean">Limpar Todos os Marcadores</button>
        </div>
      </div>

      <MapContainer center={[-3.71722, -38.5434]} zoom={13} style={{ height: "400px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={[marker.lat, marker.lng]}
            icon={marker.type === 'red' ? redIcon : marker.type === 'blue' ? blueIcon : yellowIcon}
          >
            <Popup>
              {marker.type === 'yellow' ? (
                <div>
                  <input
                    type="text"
                    value={marker.name}
                    onChange={(e) => updateMarkerName(idx, e.target.value)}
                    placeholder="Digite o nome do ponto"
                  />
                </div>
              ) : (
                <span>{marker.name}</span>
              )}
            </Popup>
          </Marker>
        ))}
        <Polyline positions={route} pathOptions={{ color: 'blue', weight: 3 }} />
        <MapEvents />
        <div className="map-legend">
          <h4>Legenda</h4>
          <p><span className="legend-icon red"></span> Caixas de Emenda</p>
          <p><span className="legend-icon blue"></span> POP</p>
          <p><span className="legend-icon yellow"></span> Ponto Personalizado</p>
        </div>
      </MapContainer>

      <div className="route-form">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome da Rota"
          className="input-field"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descrição da Rota"
          className="input-field"
        ></textarea>
        <div className="form-buttons">
          <button onClick={saveAsKMZ} className="button">Salvar Rota como KMZ</button>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar KMZ pelo nome ou descrição"
          className="search-input"
        />
      </div>

      {/* Tabela de KMZs criados */}
      <div className="kmz-table">
        <h3>KMZs Criados</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredKMZs.map((kmz, index) => (
              <tr key={index}>
                <td>{kmz.name}</td>
                <td>{kmz.description}</td>
                <td>{kmz.date}</td>
                <td>
                  <button onClick={() => downloadKMZ(kmz.file, kmz.name)}>Baixar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
