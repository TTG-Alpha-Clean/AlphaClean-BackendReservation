import { pool } from '../database/index';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

export async function loginAdmin(email: string, password: string): Promise<any> {
  const { rows } = await pool.query(
    'SELECT id, nome, email, senha FROM usuarios WHERE email = $1 AND role = $2 LIMIT 1',
    [email, 'admin']
  );

  if (!rows.length) {
    return { ok: false, status: 401, msg: 'Credenciais inválidas.' };
  }

  const admin = rows[0];
  const isMatch = await bcrypt.compare(password, admin.senha);
  if (!isMatch) {
    return { ok: false, status: 401, msg: 'Credenciais inválidas.' };
  }

  const secret = process.env.JWT_SECRET as Secret;
  if (!secret) {
    throw new Error('JWT_SECRET não está definida nas variáveis de ambiente.');
  }

  // Set proper expiration time in seconds (1 hour = 3600 seconds)
  const expiresIn = '1h';

  const payload: JwtPayload = {
    sub: admin.id,
    role: 'admin',
    email: admin.email,
    nome: admin.nome
  };

  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn
  };

  const token = jwt.sign(payload, secret, options);

  return {
    ok: true,
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      nome: admin.nome
    }
  };
}
