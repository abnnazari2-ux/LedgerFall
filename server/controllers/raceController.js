const supabase = require('../config/supabase');

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { world_number, level_number, dataset_seed, max_players } = req.body;

    if (!world_number || !level_number) {
      return res.status(400).json({ error: 'world_number and level_number are required' });
    }

    let code;
    let attempts = 0;
    let roomCreated = false;
    let newRoom;

    // Generate unique room code
    while (!roomCreated && attempts < 10) {
      code = generateRoomCode();
      const seed = dataset_seed || Math.floor(Math.random() * 1000000);

      const { data: room, error } = await supabase
        .from('race_rooms')
        .insert({
          room_code: code,
          host_user_id: userId,
          world_number,
          level_number,
          dataset_seed: seed,
          status: 'waiting',
          max_players: max_players || 4,
        })
        .select()
        .single();

      if (!error) {
        newRoom = room;
        roomCreated = true;
      } else if (error.code === '23505') {
        // Unique constraint violation — try another code
        attempts++;
      } else {
        console.error('createRoom error:', error);
        return res.status(500).json({ error: 'Failed to create room' });
      }
    }

    if (!roomCreated) {
      return res.status(500).json({ error: 'Failed to generate unique room code' });
    }

    // Auto-join host to the room
    const { data: userInfo } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    await supabase.from('race_participants').insert({
      room_id: newRoom.id,
      user_id: userId,
      display_name: userInfo ? userInfo.display_name : 'Host',
      score: 0,
      progress_percent: 0,
      finished: false,
    });

    return res.status(201).json({
      room_code: newRoom.room_code,
      room_id: newRoom.id,
      world_number: newRoom.world_number,
      level_number: newRoom.level_number,
      dataset_seed: newRoom.dataset_seed,
      max_players: newRoom.max_players,
      status: newRoom.status,
    });
  } catch (err) {
    console.error('createRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    // Find the room
    const { data: room, error: roomError } = await supabase
      .from('race_rooms')
      .select('*')
      .eq('room_code', code.toUpperCase())
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: `Room is ${room.status}. Can only join waiting rooms.` });
    }

    // Check current participant count
    const { data: participants, count: participantCount } = await supabase
      .from('race_participants')
      .select('*', { count: 'exact' })
      .eq('room_id', room.id);

    if (participantCount >= room.max_players) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if already joined
    const alreadyJoined = (participants || []).find(p => p.user_id === userId);
    if (alreadyJoined) {
      return res.json({
        room,
        participants: participants || [],
        message: 'Already in room',
      });
    }

    // Get user's display name
    const { data: userInfo } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    // Add participant
    await supabase.from('race_participants').insert({
      room_id: room.id,
      user_id: userId,
      display_name: userInfo ? userInfo.display_name : 'Player',
      score: 0,
      progress_percent: 0,
      finished: false,
    });

    // Fetch updated participants
    const { data: updatedParticipants } = await supabase
      .from('race_participants')
      .select('*')
      .eq('room_id', room.id);

    return res.json({
      room,
      participants: updatedParticipants || [],
    });
  } catch (err) {
    console.error('joinRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getRoom = async (req, res) => {
  try {
    const { code } = req.params;

    const { data: room, error: roomError } = await supabase
      .from('race_rooms')
      .select('*')
      .eq('room_code', code.toUpperCase())
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const { data: participants } = await supabase
      .from('race_participants')
      .select('*')
      .eq('room_id', room.id)
      .order('score', { ascending: false });

    return res.json({
      room,
      participants: participants || [],
    });
  } catch (err) {
    console.error('getRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createRoom, joinRoom, getRoom };
