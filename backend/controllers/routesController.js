const supabase = require('../config/supabaseClient');
const multer = require('multer');
const { createWriteStream } = require('fs');
const { exec } = require('child_process');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const saveRoute = async (req, res) => {
  const { name, description } = req.body;
  const { buffer, originalname } = req.file;

  try {
    const fileName = `${Date.now()}_${originalname}`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    // Salva o arquivo temporariamente
    const writeStream = createWriteStream(filePath);
    writeStream.write(buffer);
    writeStream.end();

    // Converte o arquivo para KMZ usando uma ferramenta como ogr2ogr ou outra ferramenta de conversão
    exec(`ogr2ogr -f "KML" ${filePath}.kmz ${filePath}`, async (error) => {
      if (error) throw error;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('routes')
        .upload(`routes/${fileName}.kmz`, buffer, {
          contentType: 'application/vnd.google-earth.kmz',
        });

      if (uploadError) throw uploadError;

      const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/routes/${uploadData.path}`;

      const { error } = await supabase
        .from('routes')
        .insert([{ name, description, created_at: new Date(), file_url: fileUrl }]);

      if (error) throw error;

      res.status(200).send('Rota salva com sucesso!');
    });
  } catch (err) {
    console.error('Erro ao salvar os dados da rota:', err);
    res.status(500).send('Erro ao salvar os dados da rota.');
  }
};

module.exports = {
  saveRoute,
  upload,
};
