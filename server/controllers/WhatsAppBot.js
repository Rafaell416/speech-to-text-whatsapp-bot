import speech from '@google-cloud/speech';
import dotenv from 'dotenv';
import twilio from 'twilio';
import axios from 'axios';

dotenv.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const { MessagingResponse } = twilio.twiml;
const client = new speech.SpeechClient();
 
class WhatsappBot {
  /**
   * @memberof WhatsappBot
   * @param {object} req - Request sent to the route
   * @param {object} res - Response sent from the controller
   * @param {object} next - Error handler
   * @returns {object} - object representing response message
   */

  static async transcript(req, res, next) {
    const isTextMessage = req.body.Body && req.body.Body.length > 0;
    const isAudioMessage = req.body.MediaUrl0 && req.body.MediaUrl0.length > 0;

    const twiml = new MessagingResponse();

    if (isTextMessage) {
      twiml.message("Porfavor envíanos un audio.");
      res.set('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    if (isAudioMessage) {
      try {
        const rawAudio = await axios.get(req.body.MediaUrl0, {responseType: 'arraybuffer'});
        const buffer = new Buffer.from(rawAudio.data, 'binary').toString('base64')
        

        // const fileName = '/Users/rafaell416/Documents/CODE/OTHERS/whatsapp-bot/audio.mp3';
        // const file = fs.readFileSync(fileName);
        // const buffer = file.toString('base64');

        const encoding = 'MP3';
        const sampleRateHertz = 48000;
        const languageCode = 'es-MX';
        const audioChannelCount = 2 
    
        const config = { 
          encoding, 
          sampleRateHertz, 
          languageCode,
          audioChannelCount
        };
        const audio = { content: buffer };
        const request = { audio, config };

        const [response] = await client.recognize(request);
        const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

        twiml.message(transcription);
        res.set('Content-Type', 'text/xml');
        return res.status(200).send(twiml.toString());

      } catch (error) {
        console.log(error)
        return next(error);
      }
    }
  }
}

export default WhatsappBot;