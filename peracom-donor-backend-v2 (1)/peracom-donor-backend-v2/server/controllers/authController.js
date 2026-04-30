import { generateToken } from '../utils/generateToken.js';
import { isValidEmail, requireFields, validatePassword } from '../utils/validators.js';
import { loginDonorAccount, registerDonorAccount } from '../services/donorService.js';

export async function register(req, res) {
  try {
    const required = requireFields(req.body, ['full_name', 'email', 'password']);
    if (!required.ok) {
      return res.status(400).json({ message: `Missing required fields: ${required.missing.join(', ')}` });
    }

    if (!isValidEmail(req.body.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const passwordError = validatePassword(req.body.password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const result = await registerDonorAccount(req.body);
    const token = result.body.user ? generateToken(result.body.user) : null;

    return res.status(result.status).json({
      ...result.body,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register donor', error: error.message });
  }
}

export async function login(req, res) {
  try {
    const required = requireFields(req.body, ['email', 'password']);
    if (!required.ok) {
      return res.status(400).json({ message: `Missing required fields: ${required.missing.join(', ')}` });
    }

    if (!isValidEmail(req.body.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const result = await loginDonorAccount(req.body.email, req.body.password);
    if (!result.body.user) {
      return res.status(result.status).json(result.body);
    }

    const token = generateToken(result.body.user);

    return res.status(result.status).json({
      ...result.body,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login donor', error: error.message });
  }
}
