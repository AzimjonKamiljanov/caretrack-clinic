import app, { initApp } from './app';

const PORT = process.env.PORT || 3001;

initApp().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏥 CareTrack Clinic MRMS ishlayapti: http://localhost:${PORT}`);
    console.log('📋 Admin login: admin / admin123\n');
  });
});
