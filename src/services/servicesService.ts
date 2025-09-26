import { pool } from '../database/index';

// Interface for service data (different from servicoService to avoid conflicts)
interface ServiceData {
  type?: string;
  title?: string;
  subtitle?: string;
  valor?: number;
  time_minutes?: number;
  description?: string;
  [key: string]: any;
}

// CREATE
export async function createService(
  data: ServiceData,
  file?: Express.Multer.File
): Promise<any> {
  const { type, title, subtitle, valor, time_minutes, description } = data;
  const imageUrl = file ? file.path : null;

  const result = await pool.query(
    `INSERT INTO services
      (type, title, subtitle, valor, time_minutes, description, image_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [type, title, subtitle, valor, time_minutes, description, imageUrl]
  );

  return result.rows[0];
}

// READ - todos
export async function getAllServices(): Promise<any[]> {
  const result = await pool.query(`
    SELECT
      s.id AS service_id,
      s.type,
      s.title,
      s.subtitle,
      s.valor AS price,
      s.time_minutes AS time,
      s.description AS service_description,
      s.image_url,
      s.created_at AS service_created_at,
      s.updated_at AS service_updated_at,
      s.deleted_at,
      json_agg(
        json_build_object(
          'id', i.id,
          'description', i.description,
          'createdAt', i.created_at,
          'updatedAt', i.updated_at
        )
      ) FILTER (WHERE i.id IS NOT NULL) AS informations
    FROM services s
    LEFT JOIN service_informations i ON s.id = i.service_id
    WHERE s.deleted_at IS NULL
    GROUP BY s.id
    ORDER BY s.id;
  `);

  return result.rows;
}

// READ - por ID
export async function getServiceById(id: string): Promise<any | null> {
  const result = await pool.query(
    `
    SELECT
      s.id AS service_id,
      s.type,
      s.title,
      s.subtitle,
      s.valor AS price,
      s.time_minutes AS time,
      s.description AS service_description,
      s.image_url,
      s.created_at AS service_created_at,
      s.updated_at AS service_updated_at,
      s.deleted_at,
      json_agg(
        json_build_object(
          'id', i.id,
          'description', i.description,
          'createdAt', i.created_at,
          'updatedAt', i.updated_at
        )
      ) FILTER (WHERE i.id IS NOT NULL) AS informations
    FROM services s
    LEFT JOIN service_informations i ON s.id = i.service_id
    WHERE s.id = $1 AND s.deleted_at IS NULL
    GROUP BY s.id;
  `,
    [id]
  );

  return result.rows[0] || null;
}

// UPDATE
export async function updateService(
  id: string,
  data: ServiceData,
  file?: Express.Multer.File
): Promise<any | null> {
  const { type, title, subtitle, valor, time_minutes, description } = data;
  const imageUrl = file ? file.path : null;

  const result = await pool.query(
    `UPDATE services
     SET type = $1, title = $2, subtitle = $3, valor = $4, time_minutes = $5, description = $6,
         image_url = COALESCE($7, image_url), updated_at = NOW()
     WHERE id = $8 AND deleted_at IS NULL
     RETURNING *`,
    [type, title, subtitle, valor, time_minutes, description, imageUrl, id]
  );

  return result.rows[0] || null;
}

// DELETE
export async function deleteService(id: string): Promise<any | null> {
  const result = await pool.query(
    `DELETE FROM services WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
}