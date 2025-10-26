# Kullanıcıları kontrol et
docker exec -it erp_postgres psql -U postgres -d erp_db -c "SELECT id, username, email, role FROM users;"

