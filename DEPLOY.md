# Astro 博客自有服务器部署教程

这份文档以当前项目为例，说明如何把 Astro 静态博客部署到自己的 Linux 服务器。示例服务器 IP 使用：

```text
117.72.197.49
```

推荐部署方式：

- Astro 负责构建静态文件。
- Nginx 负责对外提供 HTTP/HTTPS 访问。
- 有域名后使用 Certbot 申请 HTTPS 证书。

当前项目是静态站点，构建后输出到 `dist/`。服务器最终只需要托管 `dist/` 里的文件，不需要长期运行 Node.js 服务。

## 一、部署模式选择

你现在可能处于两种状态。

### 只有服务器 IP，没有域名

访问地址：

```text
http://117.72.197.49
```

项目配置：

```js
site: 'http://117.72.197.49',
```

Nginx 配置：

```nginx
server_name 117.72.197.49 _;
```

这种方式可以先跑通博客，但不建议长期使用。没有域名时 HTTPS 配置比较麻烦，正式上线建议先购买或准备域名。

### 有域名，部署到子域名

假设你的域名是：

```text
example.com
```

你希望博客地址是：

```text
https://blog.example.com
```

DNS 需要添加：

```text
记录类型：A
主机记录：blog
记录值：117.72.197.49
TTL：默认
```

项目配置：

```js
site: 'https://blog.example.com',
```

Nginx 配置：

```nginx
server_name blog.example.com;
```

有域名后可以用 Certbot 自动申请 HTTPS 证书。

## 二、本文使用的目录

后续命令统一使用这些目录：

```text
源码目录：/opt/fzblog
网站目录：/var/www/fzblog
Nginx 配置文件：/etc/nginx/sites-available/fzblog
Nginx 启用链接：/etc/nginx/sites-enabled/fzblog
```

目录作用：

- `/opt/fzblog`：存放 Git 仓库源码、`node_modules/`、构建脚本和 `dist/`。
- `/var/www/fzblog`：Nginx 对外读取的静态网站目录，只放构建后的文件。
- `/etc/nginx/sites-available/fzblog`：Nginx 站点配置文件。
- `/etc/nginx/sites-enabled/fzblog`：指向 `sites-available` 的软链接，用来启用站点。

建议区分源码目录和网站目录。这样构建失败时不会影响线上已有页面。

## 三、修改 Astro 项目配置

打开项目中的 `astro.config.mjs`：

```js
export default defineConfig({
	site: 'https://example.com',
	integrations: [mdx(), sitemap()],
	fonts: [
		// ...
	],
});
```

### 只有 IP 时

改成：

```js
export default defineConfig({
	site: 'http://117.72.197.49',
	integrations: [mdx(), sitemap()],
	fonts: [
		// ...
	],
});
```

### 有子域名时

假设子域名是 `blog.example.com`，改成：

```js
export default defineConfig({
	site: 'https://blog.example.com',
	integrations: [mdx(), sitemap()],
	fonts: [
		// ...
	],
});
```

配置项说明：

- `site`：站点正式访问地址，会影响 RSS、sitemap、canonical URL 和社交分享图片地址。
- `integrations: [mdx(), sitemap()]`：启用 MDX 文章支持和 sitemap 生成。
- `fonts`：使用本地字体文件，字体位于 `src/assets/fonts/`。

修改 `astro.config.mjs` 后必须重新执行：

```sh
npm run build
```

否则生成的 RSS、sitemap、canonical 仍然是旧地址。

## 四、站点信息配置

站点名称、签名、头像、GitHub 链接集中在 `src/config.ts`：

```ts
export const siteConfig = {
	title: '泛舟 \' Blog',
	description: '闲言碎语，学习记录，麻瓜成长',
	brandMark: {
		text: '舟',
		imageSrc: '',
		background:
			'radial-gradient(circle at 32% 30%, #f6d88c 0 16%, transparent 17%), linear-gradient(135deg, #13a8d8, #465a76)',
		color: '#0f1722',
	},
	author: {
		name: '泛舟',
		avatarText: '',
		avatarSrc: '/avatar.jpg',
		signature: '驾一叶扁舟',
	},
	social: {
		github: 'https://github.com/maycode0',
	},
};
```

配置项说明：

- `title`：博客名称，显示在导航栏、页脚、RSS 和页面标题中。
- `description`：站点描述，用于 SEO 和部分页面描述。
- `brandMark.text`：导航栏左侧圆形标识中的文字。
- `brandMark.imageSrc`：导航栏圆形标识图片地址。为空时显示 `brandMark.text`。
- `brandMark.background`：导航栏圆形标识背景，可以是颜色或 CSS 渐变。
- `brandMark.color`：导航栏圆形标识文字颜色。
- `author.name`：侧边栏作者昵称。
- `author.avatarText`：没有头像图片时，侧边栏头像中显示的文字。
- `author.avatarSrc`：侧边栏头像图片地址，例如 `/avatar.jpg` 对应 `public/avatar.jpg`。
- `author.signature`：侧边栏个人签名。
- `social.github`：右上角 GitHub 图标链接。留空字符串会隐藏该入口。

这些配置会在构建时写入静态 HTML。修改后需要重新构建和部署。

## 五、评论配置

评论功能使用 `.env`：

```env
PUBLIC_DISQUS_SHORTNAME=fzblog-1
PUBLIC_DISQUS_FULL_MODE=true
```

变量说明：

- `PUBLIC_DISQUS_SHORTNAME`：Disqus 后台生成的 shortname。
- `PUBLIC_DISQUS_FULL_MODE`：为 `true` 时加载完整 Disqus 评论模块。

注意：

- Astro 中只有 `PUBLIC_` 开头的环境变量会暴露给浏览器。
- 不要把密码、Token、私钥写成 `PUBLIC_` 变量。
- 如果在服务器上构建，`.env` 要放在 `/opt/fzblog/.env`。
- 如果在本地构建后只上传 `dist/`，服务器不需要 `.env`。

## 六、服务器初始化

登录服务器：

```sh
ssh root@117.72.197.49
```

更新软件源：

```sh
sudo apt update
```

安装基础软件：

```sh
sudo apt install -y nginx git curl
```

命令说明：

- `apt update`：刷新软件包索引。
- `nginx`：用来托管静态网站。
- `git`：从 GitHub 拉取代码。
- `curl`：下载脚本或测试 HTTP 请求。
- `-y`：自动确认安装。

启动 Nginx 并设置开机自启：

```sh
sudo systemctl enable --now nginx
```

命令说明：

- `enable`：设置开机启动。
- `--now`：立即启动服务。

检查 Nginx 状态：

```sh
sudo systemctl status nginx
```

看到 `active (running)` 说明 Nginx 正在运行。

## 七、安装 Node.js

项目要求 Node.js `>= 22.12.0`。如果你选择在服务器上构建，需要安装 Node.js。

安装 Node.js 22：

```sh
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

检查版本：

```sh
node -v
npm -v
```

命令说明：

- `curl -fsSL ...`：下载 NodeSource 安装脚本。
- `sudo -E bash -`：用 root 权限执行脚本。
- `apt install nodejs`：安装 Node.js 和 npm。

如果你只在本地电脑构建，然后上传 `dist/`，服务器可以不安装 Node.js。

## 八、创建网站目录

创建 Nginx 网站目录：

```sh
sudo mkdir -p /var/www/fzblog
```

设置权限：

```sh
sudo chown -R www-data:www-data /var/www/fzblog
sudo chmod -R 755 /var/www/fzblog
```

命令说明：

- `mkdir -p`：创建目录，如果上级目录不存在会一起创建。
- `www-data`：Ubuntu/Debian 上 Nginx 默认运行用户。
- `chown -R`：递归修改目录拥有者。
- `chmod -R 755`：目录和文件可读可执行，方便 Nginx 读取。

如果你需要用当前登录用户上传文件，可以改成：

```sh
sudo chown -R $USER:www-data /var/www/fzblog
sudo chmod -R 755 /var/www/fzblog
```

## 九、部署方式 A：本地构建后上传

这种方式适合在 Windows 本地写博客，然后上传静态文件。服务器不需要访问 GitHub，也不需要在服务器上安装 Node.js。

在本地项目目录执行：

```sh
npm install
npm run build
```

命令说明：

- `npm install`：安装依赖。
- `npm run build`：生成生产文件到 `dist/`。

推荐把 `dist/` 打包成一个压缩包上传：

```sh
tar -czf fzblog-dist.tar.gz -C dist .
scp fzblog-dist.tar.gz root@117.72.197.49:/tmp/fzblog-dist.tar.gz
```

然后在服务器执行部署脚本：

```sh
ssh root@117.72.197.49 "bash /opt/deploy-fzblog.sh"
```

`/opt/deploy-fzblog.sh` 的内容见“十五、推荐部署脚本”。

如果你已经在 Windows 的 SSH 配置里配置了服务器别名，例如 `jd`，命令可以写成：

```sh
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
ssh jd "bash /opt/deploy-fzblog.sh"
```

也可以在项目根目录创建 `deploy.bat`，以后双击或在命令行执行它即可发布：

```bat
@echo off

echo [1/4] Build...
call npm run build
if errorlevel 1 pause & exit /b 1

echo [2/4] Pack...
if exist fzblog-dist.tar.gz del fzblog-dist.tar.gz
tar -czf fzblog-dist.tar.gz -C dist .
if errorlevel 1 pause & exit /b 1

echo [3/4] Upload...
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
if errorlevel 1 pause & exit /b 1

echo Cleaning local archive...
if exist fzblog-dist.tar.gz del fzblog-dist.tar.gz

echo [4/4] Deploy on server...
ssh jd "bash /opt/deploy-fzblog.sh"
if errorlevel 1 pause & exit /b 1

echo Done.
pause
```

注意：

- `.bat` 里执行 `npm run build` 必须写成 `call npm run build`，否则后面的 `tar`、`scp` 不会继续执行。
- `fzblog-dist.tar.gz` 这个文件名必须和服务器脚本里的 `ARCHIVE="/tmp/fzblog-dist.tar.gz"` 保持一致。
- `jd` 是 SSH 别名。如果没有配置别名，就改成 `root@117.72.197.49` 或 `root@blog.example.com`。
- 上传完成后本地压缩包可以删除，服务器端脚本会使用 `/tmp/fzblog-dist.tar.gz`。

正确目录结构：

```text
/var/www/fzblog/index.html
/var/www/fzblog/about/index.html
/var/www/fzblog/archives/index.html
/var/www/fzblog/_astro/...
```

错误目录结构：

```text
/var/www/fzblog/dist/index.html
```

如果出现错误目录结构，说明把整个 `dist` 文件夹放进了网站目录。使用本文的 `tar -czf fzblog-dist.tar.gz -C dist .` 可以避免这个问题。

## 十、部署方式 B：服务器拉 Git 构建

这种方式适合服务器可以稳定访问 GitHub 和 npm 源的情况。如果服务器无法访问 GitHub，使用“部署方式 A：本地构建后上传”。

克隆仓库：

```sh
sudo git clone https://github.com/maycode0/fzBlog.git /opt/fzblog
```

进入源码目录：

```sh
cd /opt/fzblog
```

安装依赖：

```sh
npm install
```

构建：

```sh
npm run build
```

发布到 Nginx 网站目录：

```sh
sudo rm -rf /var/www/fzblog/*
sudo cp -r dist/* /var/www/fzblog/
sudo chown -R www-data:www-data /var/www/fzblog
sudo chmod -R 755 /var/www/fzblog
```

命令说明：

- `git clone ... /opt/fzblog`：把源码下载到 `/opt/fzblog`。
- `npm install`：安装项目依赖。
- `npm run build`：生成 `dist/`。
- `rm -rf /var/www/fzblog/*`：删除旧版本静态文件。
- `cp -r dist/* /var/www/fzblog/`：复制新构建文件。
- `chown` 和 `chmod`：确保 Nginx 可以读取文件。

后续更新博客时执行：

```sh
cd /opt/fzblog
git pull
npm install
npm run build
sudo rm -rf /var/www/fzblog/*
sudo cp -r dist/* /var/www/fzblog/
sudo chown -R www-data:www-data /var/www/fzblog
sudo chmod -R 755 /var/www/fzblog
sudo systemctl reload nginx
```

## 十一、Nginx 配置：只有 IP

如果你暂时没有域名，用 IP 访问，创建配置文件：

```sh
sudo nano /etc/nginx/sites-available/fzblog
```

写入：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 117.72.197.49 _;

    root /var/www/fzblog;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(css|js|jpg|jpeg|png|gif|svg|ico|webp|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
}
```

配置项说明：

- `listen 80 default_server`：监听 HTTP 80 端口，并作为默认站点处理没有匹配域名的请求。
- `listen [::]:80 default_server`：监听 IPv6 HTTP 80 端口。
- `server_name 117.72.197.49 _`：匹配 IP 访问和未匹配到其它站点的请求。
- `root /var/www/fzblog`：网站文件根目录。
- `index index.html`：访问目录时默认读取 `index.html`。
- `try_files $uri $uri/ =404`：先找文件，再找目录，找不到返回 404。
- `location ~* ...`：匹配静态资源文件。
- `expires 30d`：让浏览器缓存静态资源 30 天。
- `Cache-Control "public"`：允许浏览器和中间缓存保存资源。

启用站点：

```sh
sudo ln -s /etc/nginx/sites-available/fzblog /etc/nginx/sites-enabled/fzblog
```

如果默认站点还存在，删除默认站点软链接：

```sh
sudo rm -f /etc/nginx/sites-enabled/default
```

检查配置：

```sh
sudo nginx -t
```

重载 Nginx：

```sh
sudo systemctl reload nginx
```

测试访问：

```sh
curl -I http://117.72.197.49
```

看到 `HTTP/1.1 200 OK` 或 `HTTP/1.1 304 Not Modified` 都说明服务正常。

## 十二、Nginx 配置：子域名

如果你有域名，并准备部署到 `blog.example.com`，先在 DNS 服务商处添加：

```text
类型：A
主机记录：blog
记录值：117.72.197.49
TTL：默认
```

等待 DNS 生效后，可以在本地或服务器测试：

```sh
ping blog.example.com
```

或者：

```sh
nslookup blog.example.com
```

结果中应该能看到 `117.72.197.49`。

创建或修改 Nginx 配置：

```sh
sudo nano /etc/nginx/sites-available/fzblog
```

写入：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name blog.example.com;

    root /var/www/fzblog;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(css|js|jpg|jpeg|png|gif|svg|ico|webp|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
}
```

配置项说明：

- `listen 80`：监听 HTTP。
- `server_name blog.example.com`：只响应该子域名。
- `root /var/www/fzblog`：博客静态文件目录。
- `try_files $uri $uri/ =404`：适配 Astro 生成的静态目录路由，例如 `/about/` 会读取 `/about/index.html`。

检查并重载：

```sh
sudo nginx -t
sudo systemctl reload nginx
```

测试：

```sh
curl -I http://blog.example.com
```

HTTP 正常后再申请 HTTPS。

## 十三、配置 HTTPS

只有 IP 时，本文不建议配置 HTTPS。正式站点建议先绑定域名或子域名，然后用 Certbot 申请证书。

安装 Certbot：

```sh
sudo apt install -y certbot python3-certbot-nginx
```

为子域名申请证书：

```sh
sudo certbot --nginx -d blog.example.com
```

命令说明：

- `certbot`：Let's Encrypt 证书管理工具。
- `python3-certbot-nginx`：Certbot 的 Nginx 插件。
- `--nginx`：自动读取并修改 Nginx 配置。
- `-d blog.example.com`：要申请证书的域名。

执行过程中建议选择：

- 同意服务条款。
- 填写真实邮箱。
- 将 HTTP 自动重定向到 HTTPS。

申请成功后，访问：

```text
https://blog.example.com
```

检查自动续期：

```sh
sudo certbot renew --dry-run
```

如果演练成功，Certbot 会自动定期续期证书。

## 十四、防火墙和安全组

如果服务器启用了 UFW，开放 Nginx：

```sh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

命令说明：

- `Nginx Full`：开放 80 和 443 端口。
- `ufw status`：查看防火墙状态。

如果使用云服务器，还需要在云厂商控制台的安全组开放：

```text
TCP 80
TCP 443
```

只有 IP 阶段至少要开放 TCP 80。有 HTTPS 后还要开放 TCP 443。

## 十五、推荐部署脚本

如果你采用“本地构建后上传”的方式，服务器端只需要一个解压部署脚本：

```sh
sudo nano /opt/deploy-fzblog.sh
```

写入：

```sh
#!/usr/bin/env bash
set -e

ARCHIVE="/tmp/fzblog-dist.tar.gz"
WEB_DIR="/var/www/fzblog"

echo "[1/4] Checking archive..."
if [ ! -f "$ARCHIVE" ]; then
  echo "ERROR: archive not found: $ARCHIVE"
  exit 1
fi

echo "[2/4] Cleaning old files..."
mkdir -p "$WEB_DIR"
find "$WEB_DIR" -mindepth 1 -delete

echo "[3/4] Extracting new site..."
tar -xzf "$ARCHIVE" -C "$WEB_DIR"
chown -R www-data:www-data "$WEB_DIR"
chmod -R 755 "$WEB_DIR"

echo "[4/4] Checking nginx..."
nginx -t
systemctl reload nginx

echo "Deploy finished."
```

脚本说明：

- `#!/usr/bin/env bash`：使用 bash 执行脚本。
- `set -e`：任何一步失败就立即停止。
- `ARCHIVE`：Windows 上传到服务器的压缩包路径。
- `WEB_DIR`：Nginx 网站目录。
- `find "$WEB_DIR" -mindepth 1 -delete`：清理旧文件，但保留网站目录本身。
- `tar -xzf "$ARCHIVE" -C "$WEB_DIR"`：把新构建结果解压到网站目录。
- `nginx -t`：检查 Nginx 配置是否正确。
- `systemctl reload nginx`：平滑重载 Nginx。

赋予执行权限：

```sh
sudo chmod +x /opt/deploy-fzblog.sh
```

以后发布：

```sh
bash /opt/deploy-fzblog.sh
```

如果脚本只打印 `[1/4] Checking archive...` 就退出，说明服务器上没有 `/tmp/fzblog-dist.tar.gz`。先确认 Windows 端上传命令是否是：

```sh
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
```

如果不是用 `root` 登录服务器，脚本里的 `nginx -t`、`systemctl reload nginx`、`chown`、`chmod` 可能需要加 `sudo`。

## 十六、常见问题

### 访问还是 Nginx 默认页

先查看 Nginx 实际加载的配置：

```sh
sudo nginx -T 2>&1 | grep -nE "server_name|root|listen|default_server"
```

如果只看到类似：

```nginx
listen 80 default_server;
root /var/www/html;
server_name _;
```

并没有看到 `server_name blog.example.com;` 或 `root /var/www/fzblog;`，说明你的博客配置文件没有被 Nginx 加载。

查看启用的站点：

```sh
ls -l /etc/nginx/sites-enabled
```

如果没有 `fzblog -> /etc/nginx/sites-available/fzblog`，创建启用链接：

```sh
sudo ln -s /etc/nginx/sites-available/fzblog /etc/nginx/sites-enabled/fzblog
```

如果存在 `default`：

```sh
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 访问 404

检查网站目录：

```sh
ls -la /var/www/fzblog
```

正确情况下应该看到：

```text
index.html
_astro/
about/
archives/
```

如果看到 `/var/www/fzblog/dist/index.html`，说明上传目录层级错了。

### 服务器脚本停在 Checking archive

如果执行：

```sh
bash /opt/deploy-fzblog.sh
```

只输出：

```text
[1/4] Checking archive...
```

说明服务器上没有脚本需要的压缩包：

```sh
/tmp/fzblog-dist.tar.gz
```

检查：

```sh
ls -lh /tmp/fzblog-dist.tar.gz
```

Windows 端上传命令必须和服务器脚本里的文件名一致：

```bat
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
```

如果上传的是 `dist.tar.gz`，服务器脚本却找 `fzblog-dist.tar.gz`，脚本会立即退出。

### bat 只执行了 npm run build

`.bat` 调用 `npm` 时必须加 `call`：

```bat
call npm run build
```

不要写成：

```bat
npm run build
```

否则 Windows 调用 `npm.cmd` 后不会继续执行当前 bat 里的后续 `tar`、`scp`、`ssh` 命令。

### scp 仍然要求输入密码或密钥密码

`scp` 和 `ssh` 使用同一套 SSH 配置。建议在 Windows 的 `~/.ssh/config` 里配置别名，例如：

```sshconfig
Host jd
  HostName 117.72.197.49
  User root
  IdentityFile C:\Users\你的用户名\.ssh\id_ed25519
```

然后 bat 里统一使用：

```bat
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
ssh jd "bash /opt/deploy-fzblog.sh"
```

如果提示 `Enter passphrase for key`，这是在输入本地私钥密码，不是服务器密码。可以用 `ssh-agent` 缓存私钥。

### 样式或图片丢失

检查 `_astro/`：

```sh
ls -la /var/www/fzblog/_astro
```

如果 `_astro/` 不存在，说明没有完整上传 `dist/*`。

### RSS 或 sitemap 里的地址不对

检查 `astro.config.mjs` 的 `site`。

只有 IP：

```js
site: 'http://117.72.197.49',
```

子域名：

```js
site: 'https://blog.example.com',
```

修改后重新构建并部署。

### 评论不显示

如果在服务器上构建，检查：

```sh
cat /opt/fzblog/.env
```

至少需要：

```env
PUBLIC_DISQUS_SHORTNAME=fzblog-1
PUBLIC_DISQUS_FULL_MODE=true
```

修改 `.env` 后重新构建并部署。

### Certbot 证书申请失败

检查 DNS 是否指向服务器：

```sh
nslookup blog.example.com
```

检查 HTTP 是否可访问：

```sh
curl -I http://blog.example.com
```

Certbot 申请证书前，域名必须能通过 80 端口访问到当前服务器。

### 页面打开但主题、头像、站点名称没更新

这些配置来自 `src/config.ts`，是构建时写入静态页面的。修改后需要：

```sh
npm run build
sudo rm -rf /var/www/fzblog/*
sudo cp -r dist/* /var/www/fzblog/
sudo systemctl reload nginx
```

## 十七、最小命令清单

### 只有 IP，首次部署

```sh
ssh root@117.72.197.49
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo git clone https://github.com/maycode0/fzBlog.git /opt/fzblog
cd /opt/fzblog
npm install
npm run build
sudo mkdir -p /var/www/fzblog
sudo rm -rf /var/www/fzblog/*
sudo cp -r dist/* /var/www/fzblog/
sudo chown -R www-data:www-data /var/www/fzblog
sudo chmod -R 755 /var/www/fzblog
sudo nano /etc/nginx/sites-available/fzblog
sudo ln -s /etc/nginx/sites-available/fzblog /etc/nginx/sites-enabled/fzblog
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

然后访问：

```text
http://117.72.197.49
```

### 子域名，首次部署

先添加 DNS：

```text
A 记录：blog -> 117.72.197.49
```

然后修改：

```js
site: 'https://blog.example.com',
```

部署并配置 Nginx 后申请 HTTPS：

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d blog.example.com
```

然后访问：

```text
https://blog.example.com
```

### 后续更新

在 Windows 本地项目目录执行：

```bat
deploy.bat
```

如果不使用 bat，手动命令是：

```bat
call npm run build
if exist fzblog-dist.tar.gz del fzblog-dist.tar.gz
tar -czf fzblog-dist.tar.gz -C dist .
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
if exist fzblog-dist.tar.gz del fzblog-dist.tar.gz
ssh jd "bash /opt/deploy-fzblog.sh"
```
