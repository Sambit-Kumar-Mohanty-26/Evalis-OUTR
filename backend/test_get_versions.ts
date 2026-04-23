const { getVersions } = require('./src/controllers/academic/versionController');

async function test() {
  const req = {
    user: {
      tenantId: 'cmnwba1060001g8vgd51n1xwk' // Found this in check_db.ts
    }
  };
  const res = {
    status: (code) => {
      console.log('Status:', code);
      return {
        json: (data) => console.log('JSON:', data)
      };
    }
  };

  try {
    await getVersions(req, res);
  } catch (err) {
    console.error('CRASH:', err);
  }
}

test();
