const supabase = require('../config/supabase');
const certificateService = require('../services/certificateService');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, firm_name, user_type, avatar_config, linkedin_url, is_admin, created_at, last_login')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: progress, error: progressError } = await supabase
      .from('player_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError) {
      return res.status(500).json({ error: 'Failed to fetch player progress' });
    }

    // Get level progress summary: count completed levels, total stars
    const { data: levelProgress } = await supabase
      .from('level_progress')
      .select('world_number, level_number, stars_earned, completed')
      .eq('user_id', userId);

    const levelSummary = {
      total_completed: levelProgress ? levelProgress.filter(l => l.completed).length : 0,
      total_stars: levelProgress ? levelProgress.reduce((sum, l) => sum + (l.stars_earned || 0), 0) : 0,
      by_world: {},
    };

    if (levelProgress) {
      levelProgress.forEach(l => {
        if (!levelSummary.by_world[l.world_number]) {
          levelSummary.by_world[l.world_number] = { completed: 0, stars: 0 };
        }
        if (l.completed) levelSummary.by_world[l.world_number].completed++;
        levelSummary.by_world[l.world_number].stars += l.stars_earned || 0;
      });
    }

    return res.json({ user, progress, level_summary: levelSummary });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, firm_name, user_type, linkedin_url } = req.body;

    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (firm_name !== undefined) updates.firm_name = firm_name;
    if (user_type !== undefined) {
      if (!['student', 'professional'].includes(user_type)) {
        return res.status(400).json({ error: 'user_type must be student or professional' });
      }
      updates.user_type = user_type;
    }
    if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, display_name, firm_name, user_type, avatar_config, linkedin_url')
      .single();

    if (error) {
      console.error('updateProfile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Also update leaderboard display name / firm / user_type
    const lbUpdates = {};
    if (updates.display_name) lbUpdates.display_name = updates.display_name;
    if (updates.firm_name !== undefined) lbUpdates.firm_name = updates.firm_name;
    if (updates.user_type) lbUpdates.user_type = updates.user_type;

    if (Object.keys(lbUpdates).length > 0) {
      await supabase
        .from('leaderboard_global')
        .update(lbUpdates)
        .eq('user_id', userId);
    }

    return res.json({ user: updatedUser });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_config } = req.body;

    if (!avatar_config || typeof avatar_config !== 'object') {
      return res.status(400).json({ error: 'avatar_config must be an object' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ avatar_config })
      .eq('id', userId)
      .select('id, avatar_config')
      .single();

    if (error) {
      console.error('updateAvatar error:', error);
      return res.status(500).json({ error: 'Failed to update avatar' });
    }

    return res.json({ avatar_config: updatedUser.avatar_config });
  } catch (err) {
    console.error('updateAvatar error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: levelProgress, error } = await supabase
      .from('level_progress')
      .select('*')
      .eq('user_id', userId)
      .order('world_number', { ascending: true })
      .order('level_number', { ascending: true });

    if (error) {
      console.error('getProgress error:', error);
      return res.status(500).json({ error: 'Failed to fetch level progress' });
    }

    const { data: playerProgress } = await supabase
      .from('player_progress')
      .select('total_xp, current_level_title, current_world, current_level, coins, lives, streak_days, completed_worlds')
      .eq('user_id', userId)
      .single();

    return res.json({
      player_progress: playerProgress,
      level_progress: levelProgress || [],
    });
  } catch (err) {
    console.error('getProgress error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: progress, error } = await supabase
      .from('player_progress')
      .select('badges')
      .eq('user_id', userId)
      .single();

    if (error || !progress) {
      return res.status(404).json({ error: 'Player progress not found' });
    }

    return res.json({ badges: progress.badges || [] });
  } catch (err) {
    console.error('getBadges error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getCertificate = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: progress, error } = await supabase
      .from('player_progress')
      .select('certificate_earned')
      .eq('user_id', userId)
      .single();

    if (error || !progress) {
      return res.status(404).json({ error: 'Player progress not found' });
    }

    if (!progress.certificate_earned) {
      return res.status(403).json({ error: 'Certificate not yet earned. Complete all 6 worlds to unlock.' });
    }

    const certificateData = await certificateService.generateCertificateData(userId);

    return res.json({ certificate: certificateData });
  } catch (err) {
    console.error('getCertificate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProfile, updateProfile, updateAvatar, getProgress, getBadges, getCertificate };
