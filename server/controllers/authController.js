const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      is_admin: user.is_admin || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { email, password, display_name, firm_name, user_type } = req.body;

    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'Email, password, and display_name are required' });
    }

    if (!['student', 'professional'].includes(user_type)) {
      return res.status(400).json({ error: 'user_type must be student or professional' });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        display_name,
        firm_name: firm_name || null,
        user_type: user_type || 'student',
        is_admin: false,
        is_active: true,
        avatar_config: {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('User insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create player_progress record
    const { error: progressError } = await supabase
      .from('player_progress')
      .insert({
        user_id: newUser.id,
        total_xp: 0,
        current_level_title: 'Graduate Trainee',
        current_world: 1,
        current_level: 1,
        coins: 0,
        lives: 3,
        lives_last_depleted: null,
        focus_segments: 5,
        streak_days: 0,
        last_streak_date: null,
        notes_collected: 0,
        total_tasks_completed: 0,
        total_fraud_flags: 0,
        hints_used_total: 0,
        badges: [],
        completed_worlds: [],
        certificate_earned: false,
      });

    if (progressError) {
      console.error('Player progress insert error:', progressError);
      // Clean up: delete the user if progress creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      return res.status(500).json({ error: 'Failed to initialize player progress' });
    }

    // Also create leaderboard entry
    await supabase.from('leaderboard_global').insert({
      user_id: newUser.id,
      display_name: newUser.display_name,
      firm_name: newUser.firm_name,
      user_type: newUser.user_type,
      total_xp: 0,
      rank: 0,
      weekly_xp: 0,
      monthly_xp: 0,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        display_name: newUser.display_name,
        firm_name: newUser.firm_name,
        user_type: newUser.user_type,
        avatar_config: newUser.avatar_config,
        is_admin: newUser.is_admin,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please log in with Google' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        firm_name: user.firm_name,
        user_type: user.user_type,
        avatar_config: user.avatar_config,
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const google = async (req, res) => {
  try {
    const { google_id, email, display_name, avatar_url } = req.body;

    if (!google_id || !email) {
      return res.status(400).json({ error: 'google_id and email are required' });
    }

    // Try to find existing user by google_id or email
    let user = null;

    const { data: existingByGoogle } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', google_id)
      .single();

    if (existingByGoogle) {
      user = existingByGoogle;
    } else {
      const { data: existingByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (existingByEmail) {
        // Link google_id to existing account
        const { data: updated } = await supabase
          .from('users')
          .update({ google_id, last_login: new Date().toISOString() })
          .eq('id', existingByEmail.id)
          .select()
          .single();
        user = updated;
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            email: email.toLowerCase(),
            google_id,
            display_name: display_name || email.split('@')[0],
            user_type: 'student',
            is_admin: false,
            is_active: true,
            avatar_config: avatar_url ? { google_avatar: avatar_url } : {},
          })
          .select()
          .single();

        if (insertError) {
          console.error('Google user insert error:', insertError);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        user = newUser;

        // Create player_progress
        await supabase.from('player_progress').insert({
          user_id: user.id,
          total_xp: 0,
          current_level_title: 'Graduate Trainee',
          current_world: 1,
          current_level: 1,
          coins: 0,
          lives: 3,
          lives_last_depleted: null,
          focus_segments: 5,
          streak_days: 0,
          last_streak_date: null,
          notes_collected: 0,
          total_tasks_completed: 0,
          total_fraud_flags: 0,
          hints_used_total: 0,
          badges: [],
          completed_worlds: [],
          certificate_earned: false,
        });

        // Create leaderboard entry
        await supabase.from('leaderboard_global').insert({
          user_id: user.id,
          display_name: user.display_name,
          firm_name: user.firm_name,
          user_type: user.user_type,
          total_xp: 0,
          rank: 0,
          weekly_xp: 0,
          monthly_xp: 0,
        });
      }
    }

    // Update last_login for existing users
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        firm_name: user.firm_name,
        user_type: user.user_type,
        avatar_config: user.avatar_config,
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  // JWT is stateless; client should discard the token
  return res.json({ success: true, message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, display_name, firm_name, user_type, avatar_config, linkedin_url, is_admin, created_at, last_login')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, google, logout, me };
