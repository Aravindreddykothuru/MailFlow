import '../src/config';
import { sendViaEthereal } from '../src/services/sender.service';

async function test() {
  console.log('Testing email send...');
  try {
    const result = await sendViaEthereal({
      etherealUser: '',
      etherealPass: '',
      from: '"MailFlow" <aravindreddy8189@gmail.com>',
      to: 'aravindreddy8189@gmail.com',
      subject: 'MailFlow Real Delivery Test',
      html: '<h1>MailFlow Delivery Confirmed!</h1><p>This email was delivered via your configured SMTP credentials directly to your inbox.</p>',
    });
    console.log('Send result:', result);
  } catch (err) {
    console.error('Send error:', err);
  }
}

test();
