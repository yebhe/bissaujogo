# Déploiement OVH - BissauJogo

Ce guide cible un VPS OVH Ubuntu avec les domaines :

- `bissaujogo.com`
- `www.bissaujogo.com`

## 1. DNS OVH

Dans OVH > Zone DNS du domaine :

```txt
bissaujogo.com.      A      IP_DU_VPS
www.bissaujogo.com.  A      IP_DU_VPS
```

Attendre la propagation DNS.

## 2. Préparer le serveur

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx nodejs npm git
```

Créer le dossier du site :

```bash
sudo mkdir -p /var/www/bissaujogo
sudo chown -R $USER:$USER /var/www/bissaujogo
```

Copier le projet dans :

```txt
/var/www/bissaujogo
```

Structure attendue :

```txt
/var/www/bissaujogo/backend
/var/www/bissaujogo/frontend
```

## 3. Backend Django

```bash
cd /var/www/bissaujogo
python3 -m venv venv
source venv/bin/activate
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

Créer le fichier `.env` depuis l’exemple :

```bash
cp .env.production.example .env
nano .env
```

Remplacer :

```txt
SECRET_KEY=change-moi-avec-une-cle-secrete-longue
EMAIL_HOST_PASSWORD=mot-de-passe-application-gmail
```

Puis :

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
python manage.py check
```

## 4. Frontend React/Vite

```bash
cd /var/www/bissaujogo/frontend
npm install
npm run build
```

Le build doit générer :

```txt
/var/www/bissaujogo/frontend/dist
```

Django sert ensuite `index.html` et les assets depuis ce dossier.

## 5. Gunicorn systemd

Copier le service :

```bash
sudo cp /var/www/bissaujogo/deploy/gunicorn-bissaujogo.service /etc/systemd/system/bissaujogo.service
sudo systemctl daemon-reload
sudo systemctl enable bissaujogo
sudo systemctl start bissaujogo
sudo systemctl status bissaujogo
```

## 6. Nginx

Copier la config :

```bash
sudo cp /var/www/bissaujogo/deploy/nginx-bissaujogo.conf /etc/nginx/sites-available/bissaujogo
sudo ln -s /etc/nginx/sites-available/bissaujogo /etc/nginx/sites-enabled/bissaujogo
sudo nginx -t
```

Avant SSL, si le certificat n’existe pas encore, commente temporairement le bloc HTTPS ou lance Certbot avec Nginx directement.

## 7. Certificat SSL Let’s Encrypt

```bash
sudo certbot --nginx -d bissaujogo.com -d www.bissaujogo.com
```

Puis :

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Redémarrer après mise à jour

Après chaque changement backend :

```bash
cd /var/www/bissaujogo/backend
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart bissaujogo
sudo systemctl reload nginx
```

Après chaque changement frontend :

```bash
cd /var/www/bissaujogo/frontend
npm install
npm run build
sudo systemctl restart bissaujogo
```

## 9. Vérifications

Ouvrir :

```txt
https://bissaujogo.com
https://www.bissaujogo.com
https://bissaujogo.com/api/terrains/
https://bissaujogo.com/robots.txt
https://bissaujogo.com/sitemap.xml
```

## 10. Notes importantes

- Ne jamais publier le fichier `.env`.
- En production, `DEBUG=False`.
- Le domaine est déjà configuré dans Django : `bissaujogo.com` et `www.bissaujogo.com`.
- Les routes inconnues sont servies par React pour afficher la page 404 personnalisée.
