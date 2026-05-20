const supabase = require('../config/supabase');
const livesService = require('../services/livesService');
const xpService = require('../services/xpService');

const getLives = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: progress, error } = await supabase
      .from('player_progress')
      .select('lives, lives_last_depleted')
      .eq('user_id', userId)
      .single();

    if (error || !progress) {
      return res.status(404).json({ error: 'Player progress not found' });
    }

    const livesInfo = livesService.calculateLives(progress);

    return res.json(livesInfo);
  } catch (err) {
    console.error('getLives error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { world_number, level_number, task_type, dataset_seed } = req.body;

    if (!world_number || !level_number) {
      return res.status(400).json({ error: 'world_number and level_number are required' });
    }

    const seed = dataset_seed || Math.floor(Math.random() * 1000000);

    const { data: session, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        world_number,
        level_number,
        task_type: task_type || 'standard',
        dataset_seed: seed,
        score: 0,
        xp_earned: 0,
        coins_earned: 0,
        lives_lost: 0,
        hints_used: 0,
        fraud_detected: false,
        false_positives: 0,
        time_taken_seconds: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('startSession error:', error);
      return res.status(500).json({ error: 'Failed to create game session' });
    }

    return res.status(201).json({
      session_id: session.id,
      dataset_seed: seed,
      world_number,
      level_number,
    });
  } catch (err) {
    console.error('startSession error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const completeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      session_id,
      score,
      time_taken_seconds,
      hints_used,
      fraud_detected,
      false_positives,
      lives_lost,
      speed_star,
      accuracy_star,
      detective_star,
    } = req.body;

    if (!session_id || score === undefined) {
      return res.status(400).json({ error: 'session_id and score are required' });
    }

    // Fetch session to verify ownership and get world/level
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Fetch current player progress
    const { data: progress, error: progressError } = await supabase
      .from('player_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError || !progress) {
      return res.status(404).json({ error: 'Player progress not found' });
    }

    // Calculate XP
    const xpParams = {
      world_number: session.world_number,
      level_number: session.level_number,
      speedStar: speed_star || false,
      accuracyStar: accuracy_star || false,
      detectiveStar: detective_star || false,
      streak_days: progress.streak_days || 0,
      hints_used: hints_used || 0,
      false_positives: false_positives || 0,
    };

    const xp_earned = xpService.calculateXP(xpParams);
    const coins_earned = Math.floor(xp_earned / 10);

    // Calculate stars earned (0-3)
    let stars_earned = 0;
    if (speed_star) stars_earned++;
    if (accuracy_star) stars_earned++;
    if (detective_star) stars_earned++;

    // Update game session
    await supabase
      .from('game_sessions')
      .update({
        score,
        xp_earned,
        coins_earned,
        lives_lost: lives_lost || 0,
        hints_used: hints_used || 0,
        fraud_detected: fraud_detected || false,
        false_positives: false_positives || 0,
        time_taken_seconds: time_taken_seconds || 0,
      })
      .eq('id', session_id);

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    const lastStreak = progress.last_streak_date;
    let newStreak = progress.streak_days || 0;

    if (lastStreak) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastStreak === yesterdayStr) {
        newStreak += 1;
      } else if (lastStreak !== today) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Update player_progress
    const newTotalXp = (progress.total_xp || 0) + xp_earned;
    const newCoins = (progress.coins || 0) + coins_earned;
    const newTotalTasks = (progress.total_tasks_completed || 0) + 1;
    const newTotalFraudFlags = (progress.total_fraud_flags || 0) + (fraud_detected ? 1 : 0);
    const newHintsUsedTotal = (progress.hints_used_total || 0) + (hints_used || 0);

    // Update lives if lost
    let newLives = progress.lives;
    let newLivesLastDepleted = progress.lives_last_depleted;
    if (lives_lost && lives_lost > 0) {
      newLives = Math.max(0, newLives - lives_lost);
      if (newLives < 3) {
        newLivesLastDepleted = new Date().toISOString();
      }
    }

    // Get new career title
    const newTitle = xpService.getCareerTitle(newTotalXp);

    // Check if all worlds completed
    let updatedCompletedWorlds = [...(progress.completed_worlds || [])];
    // Fetch current level progress for this world/level
    const { data: existingLevelProgress } = await supabase
      .from('level_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('world_number', session.world_number)
      .eq('level_number', session.level_number)
      .single();

    // Update level_progress
    const levelData = {
      user_id: userId,
      world_number: session.world_number,
      level_number: session.level_number,
      completed: true,
      unlocked: true,
      stars_earned: Math.max(stars_earned, existingLevelProgress ? existingLevelProgress.stars_earned : 0),
      best_score: Math.max(score, existingLevelProgress ? existingLevelProgress.best_score : 0),
      speed_star: speed_star || (existingLevelProgress ? existingLevelProgress.speed_star : false),
      accuracy_star: accuracy_star || (existingLevelProgress ? existingLevelProgress.accuracy_star : false),
      detective_star: detective_star || (existingLevelProgress ? existingLevelProgress.detective_star : false),
      hints_used: hints_used || 0,
      time_taken_seconds: time_taken_seconds || 0,
      attempts: (existingLevelProgress ? existingLevelProgress.attempts : 0) + 1,
      completed_at: new Date().toISOString(),
    };

    if (existingLevelProgress) {
      await supabase
        .from('level_progress')
        .update(levelData)
        .eq('id', existingLevelProgress.id);
    } else {
      await supabase.from('level_progress').insert(levelData);
    }

    // Check if world is fully completed (5 levels per world)
    const { data: worldLevels } = await supabase
      .from('level_progress')
      .select('level_number, completed')
      .eq('user_id', userId)
      .eq('world_number', session.world_number)
      .eq('completed', true);

    if (worldLevels && worldLevels.length >= 5) {
      if (!updatedCompletedWorlds.includes(session.world_number)) {
        updatedCompletedWorlds.push(session.world_number);
      }
    }

    // Check badge conditions
    const newBadges = [...(progress.badges || [])];

    // caffeine_auditor: 50 tasks completed
    if (newTotalTasks >= 50 && !newBadges.includes('caffeine_auditor')) {
      newBadges.push('caffeine_auditor');
    }

    // fraud_hunter: 6+ fraud flags
    if (newTotalFraudFlags >= 6 && !newBadges.includes('fraud_hunter')) {
      newBadges.push('fraud_hunter');
    }

    // big4_legend: all 6 worlds completed
    if (updatedCompletedWorlds.length >= 6 && !newBadges.includes('big4_legend')) {
      newBadges.push('big4_legend');
    }

    // zero_hints_hero: complete a level with 0 hints
    if ((hints_used === 0 || !hints_used) && !newBadges.includes('zero_hints_hero')) {
      newBadges.push('zero_hints_hero');
    }

    // Check certificate
    const certificateEarned = updatedCompletedWorlds.length >= 6;

    await supabase
      .from('player_progress')
      .update({
        total_xp: newTotalXp,
        current_level_title: newTitle,
        coins: newCoins,
        lives: newLives,
        lives_last_depleted: newLivesLastDepleted,
        streak_days: newStreak,
        last_streak_date: today,
        total_tasks_completed: newTotalTasks,
        total_fraud_flags: newTotalFraudFlags,
        hints_used_total: newHintsUsedTotal,
        badges: newBadges,
        completed_worlds: updatedCompletedWorlds,
        certificate_earned: certificateEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Update leaderboard_global
    await supabase
      .from('leaderboard_global')
      .update({
        total_xp: newTotalXp,
        weekly_xp: supabase.rpc ? undefined : undefined, // handled separately
        monthly_xp: supabase.rpc ? undefined : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Increment weekly and monthly XP using raw update
    await supabase.rpc('increment_leaderboard_xp', {
      p_user_id: userId,
      p_xp: xp_earned,
    }).then(() => {}).catch(() => {
      // If RPC doesn't exist, do a manual update
    });

    // Update firm_leaderboard if user has a firm
    const { data: userInfo } = await supabase
      .from('users')
      .select('firm_name')
      .eq('id', userId)
      .single();

    if (userInfo && userInfo.firm_name) {
      await supabase.rpc('update_firm_xp', {
        p_firm_name: userInfo.firm_name,
        p_xp: xp_earned,
      }).then(() => {}).catch(async () => {
        // Fallback: upsert firm_leaderboard
        const { data: existingFirm } = await supabase
          .from('firm_leaderboard')
          .select('id, total_xp, member_count')
          .eq('firm_name', userInfo.firm_name)
          .single();

        if (existingFirm) {
          await supabase
            .from('firm_leaderboard')
            .update({
              total_xp: existingFirm.total_xp + xp_earned,
              updated_at: new Date().toISOString(),
            })
            .eq('firm_name', userInfo.firm_name);
        } else {
          await supabase.from('firm_leaderboard').insert({
            firm_name: userInfo.firm_name,
            total_xp: xp_earned,
            member_count: 1,
            rank: 0,
          });
        }
      });
    }

    const livesInfo = livesService.calculateLives({ lives: newLives, lives_last_depleted: newLivesLastDepleted });

    return res.json({
      xp_earned,
      coins_earned,
      stars_earned,
      new_total_xp: newTotalXp,
      new_title: newTitle,
      new_streak: newStreak,
      new_badges: newBadges.filter(b => !(progress.badges || []).includes(b)),
      certificate_earned: certificateEarned && !progress.certificate_earned,
      lives: livesInfo,
    });
  } catch (err) {
    console.error('completeSession error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const useHint = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: progress, error } = await supabase
      .from('player_progress')
      .select('focus_segments')
      .eq('user_id', userId)
      .single();

    if (error || !progress) {
      return res.status(404).json({ error: 'Player progress not found' });
    }

    const currentFocus = progress.focus_segments || 0;

    if (currentFocus <= 0) {
      return res.status(400).json({ error: 'No focus segments remaining' });
    }

    const newFocus = Math.max(0, currentFocus - 1);

    await supabase
      .from('player_progress')
      .update({ focus_segments: newFocus })
      .eq('user_id', userId);

    return res.json({ focus_segments: newFocus });
  } catch (err) {
    console.error('useHint error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getDailyChallenge = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    let { data: challenge, error } = await supabase
      .from('daily_challenge')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (error || !challenge) {
      // Auto-create a challenge for today
      const world_number = Math.floor(Math.random() * 6) + 1;
      const level_number = Math.floor(Math.random() * 5) + 1;
      const dataset_seed = Math.floor(Math.random() * 1000000);

      const { data: newChallenge, error: insertError } = await supabase
        .from('daily_challenge')
        .insert({
          challenge_date: today,
          world_number,
          level_number,
          dataset_seed,
        })
        .select()
        .single();

      if (insertError) {
        // Another request might have created it simultaneously; try to fetch again
        const { data: existingChallenge } = await supabase
          .from('daily_challenge')
          .select('*')
          .eq('challenge_date', today)
          .single();

        if (!existingChallenge) {
          console.error('getDailyChallenge insert error:', insertError);
          return res.status(500).json({ error: 'Failed to create daily challenge' });
        }
        challenge = existingChallenge;
      } else {
        challenge = newChallenge;
      }
    }

    // Check if current user has already completed it
    let userResult = null;
    if (req.user) {
      const { data: result } = await supabase
        .from('daily_challenge_results')
        .select('score, rank, completed_at')
        .eq('challenge_id', challenge.id)
        .eq('user_id', req.user.id)
        .single();
      userResult = result;
    }

    // Get participant count
    const { count } = await supabase
      .from('daily_challenge_results')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id);

    return res.json({
      challenge,
      user_result: userResult,
      participant_count: count || 0,
    });
  } catch (err) {
    console.error('getDailyChallenge error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const submitDailyChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challenge_id, score } = req.body;

    if (!challenge_id || score === undefined) {
      return res.status(400).json({ error: 'challenge_id and score are required' });
    }

    // Verify challenge exists
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenge')
      .select('id, challenge_date')
      .eq('id', challenge_id)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if already submitted
    const { data: existingResult } = await supabase
      .from('daily_challenge_results')
      .select('id, score')
      .eq('challenge_id', challenge_id)
      .eq('user_id', userId)
      .single();

    if (existingResult) {
      // Update only if better score
      if (score > existingResult.score) {
        await supabase
          .from('daily_challenge_results')
          .update({ score, completed_at: new Date().toISOString() })
          .eq('id', existingResult.id);
      }
    } else {
      await supabase.from('daily_challenge_results').insert({
        challenge_id,
        user_id: userId,
        score,
        rank: 0,
        completed_at: new Date().toISOString(),
      });
    }

    // Calculate rank: count how many people scored higher
    const { count: higherCount } = await supabase
      .from('daily_challenge_results')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challenge_id)
      .gt('score', score);

    const rank = (higherCount || 0) + 1;

    // Update rank for this user's result
    await supabase
      .from('daily_challenge_results')
      .update({ rank })
      .eq('challenge_id', challenge_id)
      .eq('user_id', userId);

    // Get total participants
    const { count: totalCount } = await supabase
      .from('daily_challenge_results')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challenge_id);

    return res.json({ rank, total_participants: totalCount || 1, score });
  } catch (err) {
    console.error('submitDailyChallenge error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getLives,
  startSession,
  completeSession,
  useHint,
  getDailyChallenge,
  submitDailyChallenge,
};
