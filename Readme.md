## Run Using Docker

```bash
docker compose up
```

This pulls all images and starts the full stack (PostgreSQL, Ganache, Vision Server, Django, Frontend). Access the app at http://localhost:3000.

---

## Run Manually

Create New Database:

psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE medicine_db;"

Each step should be run in a separate terminal.

1. **Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Django Backend**
   ```bash
   .venv\Scripts\activate
   python manage.py runserver
   ```

3. **Vision Server (Colab)**
   ```bash
   .venv\Scripts\activate
   python colab/server.py
   ```

4. **Ganache Blockchain**
   ```bash
   ganache -m "cigar embrace tenant ceiling dose build expect mule valley opinion enemy cereal"
   ```

5. **Deploy Smart Contract**
   ```bash
   .venv\Scripts\activate
   python blockchain/deploy.py
   ```