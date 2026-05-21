const supabase = require('../config/supabase');
const xpService = require('./xpService');

/**
 * Generate certificate data for a user who has completed all 6 worlds.
 * @param {string} userId
 * @returns {Object} certificate data
 */
const generateCertificateData = async (userId) => {
  // Fetch user info
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, display_name, firm_name, user_type, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Fetch player progress
  const { data: progress, error: progressError } = await supabase
    .from('player_progress')
    .select('total_xp, current_level_title, completed_worlds, streak_days, badges, total_tasks_completed, total_fraud_flags, certificate_earned')
    .eq('user_id', userId)
    .single();

  if (progressError || !progress) {
    throw new Error('Player progress not found');
  }

  if (!progress.certificate_earned) {
    throw new Error('Certificate not yet earned');
  }

  // Fetch level progress to summarize achievements
  const { data: levelProgress } = await supabase
    .from('level_progress')
    .select('world_number, level_number, stars_earned, best_score, completed_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('world_number', { ascending: true })
    .order('level_number', { ascending: true });

  // Count total stars
  const totalStars = (levelProgress || []).reduce((sum, l) => sum + (l.stars_earned || 0), 0);
  const maxPossibleStars = 6 * 5 * 3; // 6 worlds x 5 levels x 3 stars

  // Get three-star levels (perfect completion)
  const perfectLevels = (levelProgress || []).filter(l => l.stars_earned === 3).length;

  // Get global rank
  const { count: aboveCount } = await supabase
    .from('leaderboard_global')
    .select('id', { count: 'exact', head: true })
    .gt('total_xp', progress.total_xp || 0);

  const globalRank = (aboveCount || 0) + 1;

  // Get total registered users for context
  const { count: totalUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Find the date the last world was completed
  let completionDate = null;
  if (levelProgress && levelProgress.length > 0) {
    const sortedByDate = [...levelProgress].sort(
      (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
    );
    completionDate = sortedByDate[0].completed_at;
  }

  // Build world-by-world summary
  const worldSummary = [];
  for (let w = 1; w <= 6; w++) {
    const worldLevels = (levelProgress || []).filter(l => l.world_number === w);
    worldSummary.push({
      world_number: w,
      levels_completed: worldLevels.length,
      stars: worldLevels.reduce((sum, l) => sum + (l.stars_earned || 0), 0),
      best_scores: worldLevels.map(l => l.best_score),
    });
  }

  return {
    certificate_id: `LF-${userId.substring(0, 8).toUpperCase()}-${Date.now()}`,
    issued_at: completionDate || new Date().toISOString(),
    holder: {
      display_name: user.display_name,
      firm_name: user.firm_name,
      user_type: user.user_type,
      member_since: user.created_at,
    },
    achievements: {
      total_xp: progress.total_xp,
      career_title: progress.current_level_title,
      career_title_label: xpService.getCareerTitle(progress.total_xp),
      total_stars: totalStars,
      max_possible_stars: maxPossibleStars,
      star_percentage: Math.round((totalStars / maxPossibleStars) * 100),
      perfect_levels: perfectLevels,
      badges: progress.badges || [],
      total_tasks_completed: progress.total_tasks_completed,
      total_fraud_flags: progress.total_fraud_flags,
      best_streak: progress.streak_days,
    },
    ranking: {
      global_rank: globalRank,
      total_players: totalUsers || 1,
      percentile: Math.round(((totalUsers - globalRank) / totalUsers) * 100),
    },
    world_summary: worldSummary,
    verification_code: `LF${userId.replace(/-/g, '').substring(0, 12).toUpperCase()}`,
  };
};

module.exports = { generateCertificateData };
