const supabase = require('../config/supabase');

const logAdminAction = async (adminUserId, action, targetUserId, details) => {
  try {
    await supabase.from('admin_logs').insert({
      admin_user_id: adminUserId,
      action,
      target_user_id: targetUserId || null,
      details: details || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, user_type, is_active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('users')
      .select('id, email, display_name, firm_name, user_type, is_admin, is_active, created_at, last_login, google_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }
    if (user_type) {
      query = query.eq('user_type', user_type);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('getUsers error:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    return res.json({
      users: users || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { is_admin, is_active, user_type, display_name, firm_name } = req.body;

    const updates = {};
    if (is_admin !== undefined) updates.is_admin = Boolean(is_admin);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (user_type !== undefined) {
      if (!['student', 'professional'].includes(user_type)) {
        return res.status(400).json({ error: 'user_type must be student or professional' });
      }
      updates.user_type = user_type;
    }
    if (display_name !== undefined) updates.display_name = display_name;
    if (firm_name !== undefined) updates.firm_name = firm_name;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, display_name, firm_name, user_type, is_admin, is_active')
      .single();

    if (error) {
      console.error('updateUser error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    await logAdminAction(adminId, 'update_user', id, { updates });

    return res.json({ user: updatedUser });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // New users in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: newUsersWeek } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Total game sessions
    const { count: totalSessions } = await supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true });

    // Sessions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: sessionsToday } = await supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Users by type
    const { data: studentCount } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('user_type', 'student')
      .eq('is_active', true);

    const { data: professionalCount } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('user_type', 'professional')
      .eq('is_active', true);

    // Average XP
    const { data: xpData } = await supabase
      .from('leaderboard_global')
      .select('total_xp');

    let avgXp = 0;
    if (xpData && xpData.length > 0) {
      avgXp = Math.floor(xpData.reduce((sum, u) => sum + (u.total_xp || 0), 0) / xpData.length);
    }

    // Certificates earned
    const { count: certificates } = await supabase
      .from('player_progress')
      .select('id', { count: 'exact', head: true })
      .eq('certificate_earned', true);

    return res.json({
      total_users: totalUsers || 0,
      new_users_last_7_days: newUsersWeek || 0,
      total_sessions: totalSessions || 0,
      sessions_today: sessionsToday || 0,
      users_by_type: {
        student: studentCount ? studentCount.length : 0,
        professional: professionalCount ? professionalCount.length : 0,
      },
      avg_xp: avgXp,
      certificates_earned: certificates || 0,
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, world_number } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('game_sessions')
      .select('*, users:user_id(display_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (user_id) query = query.eq('user_id', user_id);
    if (world_number) query = query.eq('world_number', parseInt(world_number));

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('getSessions error:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    return res.json({
      sessions: sessions || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('getSessions error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const resetLeaderboard = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { type } = req.body;

    if (!type || !['weekly', 'monthly', 'all'].includes(type)) {
      return res.status(400).json({ error: 'type must be weekly, monthly, or all' });
    }

    if (type === 'weekly' || type === 'all') {
      await supabase
        .from('leaderboard_global')
        .update({ weekly_xp: 0 });
    }

    if (type === 'monthly' || type === 'all') {
      await supabase
        .from('leaderboard_global')
        .update({ monthly_xp: 0 });
    }

    if (type === 'all') {
      await supabase
        .from('leaderboard_global')
        .update({ total_xp: 0, weekly_xp: 0, monthly_xp: 0 });
    }

    await logAdminAction(adminId, `reset_leaderboard_${type}`, null, { type });

    return res.json({ success: true, message: `${type} leaderboard reset successfully` });
  } catch (err) {
    console.error('resetLeaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const setDailyChallenge = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { challenge_date, world_number, level_number, dataset_seed } = req.body;

    if (!challenge_date || !world_number || !level_number) {
      return res.status(400).json({ error: 'challenge_date, world_number, and level_number are required' });
    }

    const seed = dataset_seed || Math.floor(Math.random() * 1000000);

    // Check if a challenge already exists for this date
    const { data: existing } = await supabase
      .from('daily_challenge')
      .select('id')
      .eq('challenge_date', challenge_date)
      .single();

    let challenge;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('daily_challenge')
        .update({ world_number, level_number, dataset_seed: seed })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update daily challenge' });
      }
      challenge = updated;
    } else {
      const { data: newChallenge, error } = await supabase
        .from('daily_challenge')
        .insert({ challenge_date, world_number, level_number, dataset_seed: seed })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create daily challenge' });
      }
      challenge = newChallenge;
    }

    await logAdminAction(adminId, 'set_daily_challenge', null, { challenge_date, world_number, level_number, seed });

    return res.json({ challenge });
  } catch (err) {
    console.error('setDailyChallenge error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, admin_user_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('admin_logs')
      .select('*, admin_user:admin_user_id(display_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (action) query = query.eq('action', action);
    if (admin_user_id) query = query.eq('admin_user_id', admin_user_id);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('getLogs error:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    return res.json({
      logs: logs || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('getLogs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createGlossaryTerm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { term, definition, isa_reference, cia_reference, example, world_relevance } = req.body;

    if (!term || !definition) {
      return res.status(400).json({ error: 'term and definition are required' });
    }

    const { data: glossaryTerm, error } = await supabase
      .from('glossary')
      .insert({
        term,
        definition,
        isa_reference: isa_reference || null,
        cia_reference: cia_reference || null,
        example: example || null,
        world_relevance: world_relevance || [],
      })
      .select()
      .single();

    if (error) {
      console.error('createGlossaryTerm error:', error);
      return res.status(500).json({ error: 'Failed to create glossary term' });
    }

    await logAdminAction(adminId, 'create_glossary_term', null, { term });

    return res.status(201).json({ term: glossaryTerm });
  } catch (err) {
    console.error('createGlossaryTerm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateGlossaryTerm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { term, definition, isa_reference, cia_reference, example, world_relevance } = req.body;

    const updates = {};
    if (term !== undefined) updates.term = term;
    if (definition !== undefined) updates.definition = definition;
    if (isa_reference !== undefined) updates.isa_reference = isa_reference;
    if (cia_reference !== undefined) updates.cia_reference = cia_reference;
    if (example !== undefined) updates.example = example;
    if (world_relevance !== undefined) updates.world_relevance = world_relevance;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: updatedTerm, error } = await supabase
      .from('glossary')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('updateGlossaryTerm error:', error);
      return res.status(500).json({ error: 'Failed to update glossary term' });
    }

    await logAdminAction(adminId, 'update_glossary_term', null, { id, updates });

    return res.json({ term: updatedTerm });
  } catch (err) {
    console.error('updateGlossaryTerm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteGlossaryTerm = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('glossary')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteGlossaryTerm error:', error);
      return res.status(500).json({ error: 'Failed to delete glossary term' });
    }

    await logAdminAction(adminId, 'delete_glossary_term', null, { id });

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteGlossaryTerm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  updateUser,
  getAnalytics,
  getSessions,
  resetLeaderboard,
  setDailyChallenge,
  getLogs,
  createGlossaryTerm,
  updateGlossaryTerm,
  deleteGlossaryTerm,
};
