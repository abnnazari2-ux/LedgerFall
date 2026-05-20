const supabase = require('../config/supabase');

const getGlobal = async (req, res) => {
  try {
    const {
      type = 'overall',
      period = 'alltime',
      page = 1,
    } = req.query;

    const pageSize = 20;
    const offset = (parseInt(page) - 1) * pageSize;

    let xpColumn = 'total_xp';
    if (period === 'weekly') xpColumn = 'weekly_xp';
    else if (period === 'monthly') xpColumn = 'monthly_xp';

    let query = supabase
      .from('leaderboard_global')
      .select('id, user_id, display_name, firm_name, user_type, total_xp, weekly_xp, monthly_xp, rank, updated_at')
      .order(xpColumn, { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (type !== 'overall') {
      query = query.eq('user_type', type);
    }

    const { data: entries, error, count } = await query;

    if (error) {
      console.error('getGlobal error:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    // Add rank numbers based on query position
    const rankedEntries = (entries || []).map((entry, index) => ({
      ...entry,
      position: offset + index + 1,
    }));

    // Get current user's rank if authenticated
    let currentUserRank = null;
    if (req.user) {
      const { data: userEntry } = await supabase
        .from('leaderboard_global')
        .select('total_xp, weekly_xp, monthly_xp')
        .eq('user_id', req.user.id)
        .single();

      if (userEntry) {
        const userXp = userEntry[xpColumn] || 0;
        let rankQuery = supabase
          .from('leaderboard_global')
          .select('id', { count: 'exact', head: true })
          .gt(xpColumn, userXp);

        if (type !== 'overall') {
          rankQuery = rankQuery.eq('user_type', type);
        }

        const { count: higherCount } = await rankQuery;
        currentUserRank = {
          position: (higherCount || 0) + 1,
          xp: userXp,
        };
      }
    }

    return res.json({
      entries: rankedEntries,
      page: parseInt(page),
      page_size: pageSize,
      current_user_rank: currentUserRank,
      period,
      type,
    });
  } catch (err) {
    console.error('getGlobal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getFirm = async (req, res) => {
  try {
    const { data: entries, error } = await supabase
      .from('firm_leaderboard')
      .select('*')
      .order('total_xp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('getFirm error:', error);
      return res.status(500).json({ error: 'Failed to fetch firm leaderboard' });
    }

    const rankedEntries = (entries || []).map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

    // Alliance Associates is always included
    const allianceEntry = rankedEntries.find(e => e.firm_name === 'Alliance Associates');
    if (!allianceEntry) {
      const { data: alliance } = await supabase
        .from('firm_leaderboard')
        .select('*')
        .eq('firm_name', 'Alliance Associates')
        .single();

      if (alliance) {
        rankedEntries.push({ ...alliance, position: rankedEntries.length + 1 });
      }
    }

    return res.json({ entries: rankedEntries });
  } catch (err) {
    console.error('getFirm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getDaily = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenge')
      .select('id, challenge_date, world_number, level_number')
      .eq('challenge_date', today)
      .single();

    if (challengeError || !challenge) {
      return res.json({ entries: [], challenge: null, message: 'No challenge today' });
    }

    // Get results with user display names
    const { data: results, error: resultsError } = await supabase
      .from('daily_challenge_results')
      .select(`
        id,
        user_id,
        score,
        rank,
        completed_at,
        users:user_id (display_name, firm_name, user_type, avatar_config)
      `)
      .eq('challenge_id', challenge.id)
      .order('score', { ascending: false })
      .limit(100);

    if (resultsError) {
      console.error('getDaily results error:', resultsError);
      return res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
    }

    const rankedResults = (results || []).map((result, index) => ({
      position: index + 1,
      user_id: result.user_id,
      display_name: result.users ? result.users.display_name : 'Unknown',
      firm_name: result.users ? result.users.firm_name : null,
      user_type: result.users ? result.users.user_type : null,
      avatar_config: result.users ? result.users.avatar_config : null,
      score: result.score,
      completed_at: result.completed_at,
    }));

    return res.json({
      challenge,
      entries: rankedResults,
      total: rankedResults.length,
    });
  } catch (err) {
    console.error('getDaily error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyRank = async (req, res) => {
  try {
    const userId = req.user.id;

    // Global rank (all time)
    const { data: userGlobal } = await supabase
      .from('leaderboard_global')
      .select('total_xp, weekly_xp, monthly_xp, user_type')
      .eq('user_id', userId)
      .single();

    let globalRank = null;
    let weeklyRank = null;
    let monthlyRank = null;
    let typeRank = null;

    if (userGlobal) {
      const { count: aboveAlltime } = await supabase
        .from('leaderboard_global')
        .select('id', { count: 'exact', head: true })
        .gt('total_xp', userGlobal.total_xp || 0);

      globalRank = (aboveAlltime || 0) + 1;

      const { count: aboveWeekly } = await supabase
        .from('leaderboard_global')
        .select('id', { count: 'exact', head: true })
        .gt('weekly_xp', userGlobal.weekly_xp || 0);

      weeklyRank = (aboveWeekly || 0) + 1;

      const { count: aboveMonthly } = await supabase
        .from('leaderboard_global')
        .select('id', { count: 'exact', head: true })
        .gt('monthly_xp', userGlobal.monthly_xp || 0);

      monthlyRank = (aboveMonthly || 0) + 1;

      // Type-specific rank
      if (userGlobal.user_type) {
        const { count: aboveType } = await supabase
          .from('leaderboard_global')
          .select('id', { count: 'exact', head: true })
          .eq('user_type', userGlobal.user_type)
          .gt('total_xp', userGlobal.total_xp || 0);

        typeRank = (aboveType || 0) + 1;
      }
    }

    // Daily rank for today
    const today = new Date().toISOString().split('T')[0];
    let dailyRank = null;

    const { data: todayChallenge } = await supabase
      .from('daily_challenge')
      .select('id')
      .eq('challenge_date', today)
      .single();

    if (todayChallenge) {
      const { data: myDailyResult } = await supabase
        .from('daily_challenge_results')
        .select('score, rank')
        .eq('challenge_id', todayChallenge.id)
        .eq('user_id', userId)
        .single();

      if (myDailyResult) {
        dailyRank = {
          rank: myDailyResult.rank,
          score: myDailyResult.score,
        };
      }
    }

    return res.json({
      global_rank: globalRank,
      weekly_rank: weeklyRank,
      monthly_rank: monthlyRank,
      type_rank: typeRank,
      daily_rank: dailyRank,
      xp: {
        total: userGlobal ? userGlobal.total_xp : 0,
        weekly: userGlobal ? userGlobal.weekly_xp : 0,
        monthly: userGlobal ? userGlobal.monthly_xp : 0,
      },
    });
  } catch (err) {
    console.error('getMyRank error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getGlobal, getFirm, getDaily, getMyRank };
