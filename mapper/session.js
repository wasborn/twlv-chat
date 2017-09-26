async function getSessionByName (db, name) {
  let session = await db.get('SELECT * FROM session WHERE name = ?', name);
  if (!session) {
    return;
  }

  session.peers = await db.all('SELECT address, publicKey, vector FROM session_peer WHERE name = ? ORDER BY address', name);

  return session;
}

async function insertSession (db, session) {
  await db.run(`INSERT INTO session (name) VALUES (?)`, session.name);
  await Promise.all(session.peers.map(async peer => {
    await db.run(`
      INSERT INTO session_peer (name, address, publicKey, vector)
      VALUES (?, ?, ?, ?)
    `, session.name, peer.address, peer.publicKey, peer.vector);
  }));
}

module.exports = { getSessionByName, initSession, insertSession };
