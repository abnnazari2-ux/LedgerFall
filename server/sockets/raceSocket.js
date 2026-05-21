const supabase = require('../config/supabase');
const xpService = require('../services/xpService');

/**
 * XP bonuses for race placement.
 */
const RACE_XP_BONUSES = {
  1: 300,
  2: 150,
  3: 75,
  4: 25,
};

/**
 * Initialize all race-related Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
const initRaceSocket = (io) => {
  // Map roomCode -> { participants: Map<socketId, {userId, displayName}>, raceStarted: bool }
  const roomState = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * join_room: player joins a race room
     * Payload: { room_code, user_id, display_name }
     */
    socket.on('join_room', async ({ room_code, user_id, display_name }) => {
      if (!room_code || !user_id) {
        socket.emit('error', { message: 'room_code and user_id are required' });
        return;
      }

      try {
        const code = room_code.toUpperCase();

        // Verify room exists and is valid
        const { data: room, error } = await supabase
          .from('race_rooms')
          .select('*')
          .eq('room_code', code)
          .single();

        if (error || !room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.status === 'finished') {
          socket.emit('error', { message: 'Race has already finished' });
          return;
        }

        // Join socket.io room
        socket.join(code);
        socket.data.room_code = code;
        socket.data.user_id = user_id;
        socket.data.display_name = display_name;

        // Initialize room state if needed
        if (!roomState.has(code)) {
          roomState.set(code, {
            participants: new Map(),
            raceStarted: room.status === 'active',
            roomId: room.id,
            worldNumber: room.world_number,
            levelNumber: room.level_number,
          });
        }

        const state = roomState.get(code);
        state.participants.set(socket.id, { user_id, display_name, ready: false, score: 0, progress: 0, finished: false });

        // Fetch full participant list from DB
        const { data: dbParticipants } = await supabase
          .from('race_participants')
          .select('user_id, display_name, score, progress_percent, finished')
          .eq('room_id', room.id);

        // Broadcast updated participant list to everyone in the room
        io.to(code).emit('room_update', {
          room_code: code,
          status: room.status,
          participants: dbParticipants || [],
          world_number: room.world_number,
          level_number: room.level_number,
          dataset_seed: room.dataset_seed,
          max_players: room.max_players,
        });

        socket.emit('joined_room', {
          room_code: code,
          room_id: room.id,
          dataset_seed: room.dataset_seed,
          world_number: room.world_number,
          level_number: room.level_number,
          status: room.status,
        });

        console.log(`User ${user_id} joined room ${code}`);
      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    /**
     * player_ready: player signals they are ready to start
     * Payload: { room_code }
     */
    socket.on('player_ready', async ({ room_code }) => {
      if (!room_code) return;
      const code = room_code.toUpperCase();
      const state = roomState.get(code);

      if (!state) {
        socket.emit('error', { message: 'Room not found in state' });
        return;
      }

      const participant = state.participants.get(socket.id);
      if (participant) {
        participant.ready = true;
      }

      // Check if all participants are ready
      const allReady = [...state.participants.values()].every(p => p.ready);
      const participantCount = state.participants.size;

      io.to(code).emit('ready_update', {
        ready_count: [...state.participants.values()].filter(p => p.ready).length,
        total_count: participantCount,
        all_ready: allReady,
      });

      // Auto-start if all ready and at least 2 players (or host can force start)
      if (allReady && participantCount >= 1) {
        // Host can start with 1 player for testing; in production require >= 2
      }
    });

    /**
     * start_race: host triggers race start
     * Payload: { room_code }
     */
    socket.on('start_race', async ({ room_code }) => {
      if (!room_code) return;
      const code = room_code.toUpperCase();

      try {
        const { data: room } = await supabase
          .from('race_rooms')
          .select('host_user_id, id, status')
          .eq('room_code', code)
          .single();

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('error', { message: 'Race already started or finished' });
          return;
        }

        // Only host can start
        if (room.host_user_id !== socket.data.user_id) {
          socket.emit('error', { message: 'Only the host can start the race' });
          return;
        }

        // Update room status
        await supabase
          .from('race_rooms')
          .update({ status: 'active' })
          .eq('id', room.id);

        const state = roomState.get(code);
        if (state) {
          state.raceStarted = true;
        }

        // Count down and start
        const countdown = 3;
        for (let i = countdown; i >= 1; i--) {
          io.to(code).emit('countdown', { seconds: i });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        io.to(code).emit('race_started', {
          room_code: code,
          started_at: new Date().toISOString(),
        });

        console.log(`Race started in room ${code}`);
      } catch (err) {
        console.error('start_race error:', err);
        socket.emit('error', { message: 'Failed to start race' });
      }
    });

    /**
     * progress_update: player sends their current progress
     * Payload: { room_code, progress_percent, score }
     */
    socket.on('progress_update', async ({ room_code, progress_percent, score }) => {
      if (!room_code) return;
      const code = room_code.toUpperCase();
      const state = roomState.get(code);

      if (!state || !state.raceStarted) return;

      const participant = state.participants.get(socket.id);
      if (participant) {
        participant.progress = progress_percent || 0;
        participant.score = score || 0;
      }

      // Update DB
      try {
        if (state.roomId && socket.data.user_id) {
          await supabase
            .from('race_participants')
            .update({
              progress_percent: progress_percent || 0,
              score: score || 0,
            })
            .eq('room_id', state.roomId)
            .eq('user_id', socket.data.user_id);
        }
      } catch (err) {
        // Non-critical; log but don't throw
        console.error('progress_update DB error:', err);
      }

      // Broadcast progress to all in room
      io.to(code).emit('progress_broadcast', {
        user_id: socket.data.user_id,
        display_name: socket.data.display_name,
        progress_percent: progress_percent || 0,
        score: score || 0,
      });
    });

    /**
     * player_finished: player completed the race level
     * Payload: { room_code, score, time_taken_seconds }
     */
    socket.on('player_finished', async ({ room_code, score, time_taken_seconds }) => {
      if (!room_code) return;
      const code = room_code.toUpperCase();
      const state = roomState.get(code);

      if (!state) return;

      const participant = state.participants.get(socket.id);
      if (participant && participant.finished) {
        // Already finished
        return;
      }

      if (participant) {
        participant.finished = true;
        participant.score = score || 0;
        participant.time = time_taken_seconds;
      }

      try {
        // Count how many have finished BEFORE this player
        const finishedBefore = [...state.participants.values()].filter(p => p.finished && p !== participant).length;
        const placement = finishedBefore + 1; // 1-indexed placement

        // Update DB
        if (state.roomId && socket.data.user_id) {
          await supabase
            .from('race_participants')
            .update({
              score: score || 0,
              progress_percent: 100,
              finished: true,
              finish_time: new Date().toISOString(),
            })
            .eq('room_id', state.roomId)
            .eq('user_id', socket.data.user_id);
        }

        // Award XP bonus based on placement
        const xpBonus = RACE_XP_BONUSES[placement] || 0;

        if (xpBonus > 0 && socket.data.user_id) {
          // Update player's total XP
          const { data: playerProgress } = await supabase
            .from('player_progress')
            .select('total_xp')
            .eq('user_id', socket.data.user_id)
            .single();

          if (playerProgress) {
            const newXp = (playerProgress.total_xp || 0) + xpBonus;
            const newTitle = xpService.getCareerTitle(newXp);

            await supabase
              .from('player_progress')
              .update({
                total_xp: newXp,
                current_level_title: newTitle,
              })
              .eq('user_id', socket.data.user_id);

            await supabase
              .from('leaderboard_global')
              .update({ total_xp: newXp })
              .eq('user_id', socket.data.user_id);
          }
        }

        // Notify the finishing player of their placement and bonus
        socket.emit('finish_confirmed', {
          placement,
          xp_bonus: xpBonus,
          score: score || 0,
        });

        // Broadcast to everyone in room
        io.to(code).emit('player_finished_broadcast', {
          user_id: socket.data.user_id,
          display_name: socket.data.display_name,
          placement,
          score: score || 0,
          time_taken_seconds,
        });

        // Check if all players finished
        const totalParticipants = state.participants.size;
        const finishedCount = [...state.participants.values()].filter(p => p.finished).length;

        if (finishedCount >= totalParticipants) {
          // Race complete — update room status
          if (state.roomId) {
            await supabase
              .from('race_rooms')
              .update({ status: 'finished' })
              .eq('id', state.roomId);
          }

          // Build final results
          const results = [...state.participants.entries()]
            .map(([socketId, p]) => ({
              user_id: p.user_id,
              display_name: p.display_name,
              score: p.score,
              finished: p.finished,
            }))
            .sort((a, b) => b.score - a.score)
            .map((p, index) => ({ ...p, placement: index + 1 }));

          io.to(code).emit('race_finished', {
            room_code: code,
            results,
            finished_at: new Date().toISOString(),
          });

          // Clean up room state after a delay
          setTimeout(() => {
            roomState.delete(code);
          }, 60000); // Keep state for 1 minute for late joiners
        }
      } catch (err) {
        console.error('player_finished error:', err);
        socket.emit('error', { message: 'Failed to process finish' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      const code = socket.data.room_code;
      if (!code) return;

      const state = roomState.get(code);
      if (state) {
        state.participants.delete(socket.id);

        // If room is empty, clean up
        if (state.participants.size === 0) {
          setTimeout(() => {
            if (roomState.has(code)) {
              const s = roomState.get(code);
              if (s.participants.size === 0) {
                roomState.delete(code);
              }
            }
          }, 30000);
        } else {
          // Notify remaining players
          io.to(code).emit('player_disconnected', {
            user_id: socket.data.user_id,
            display_name: socket.data.display_name,
          });
        }
      }

      console.log(`Socket disconnected: ${socket.id} (room: ${code})`);
    });
  });

  console.log('Race socket initialized');
};

module.exports = { initRaceSocket };
