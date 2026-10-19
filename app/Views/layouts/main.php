<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="base-url" content="<?= esc(base_url()) ?>">
    <title><?= esc($title ?? 'Central Maintenance Inspection Platform') ?> — <?= esc($cfg->company) ?></title>
    <link rel="icon" href="<?= base_url('assets/img/logo.jpg') ?>">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= base_url('assets/css/app.css') ?>?v=<?= time() ?>">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f4f3ef;
            color: #111827;
        }
        .hero-industrial-banner {
            position: relative;
            background-color: #1a212b;
            background-image: 
                linear-gradient(to bottom, rgba(22, 28, 36, 0.88), rgba(26, 33, 43, 0.96)),
                url('<?= base_url('assets/img/factory_hero.jpg') ?>');
            background-size: cover;
            background-position: center 35%;
        }
        .asset-overlay-badge {
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 1px solid rgba(229, 231, 235, 0.85);
        }
    </style>
</head>
<body class="antialiased selection:bg-red-700 selection:text-white">
<?= $this->renderSection('content') ?>
<script type="module" src="<?= base_url('assets/js/app.js') ?>?v=<?= time() ?>"></script>
</body>
</html>
