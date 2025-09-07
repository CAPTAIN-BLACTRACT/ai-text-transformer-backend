CREATE TABLE transformations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  selected_text TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transformations_user_id ON transformations(user_id);
CREATE INDEX idx_transformations_created_at ON transformations(created_at);
