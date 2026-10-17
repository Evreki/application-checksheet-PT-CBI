<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="base-url" content="<?= esc(base_url()) ?>">
    <title><?= esc($title ?? 'Daily Checksheet Utility') ?> — <?= esc($cfg->company) ?></title>
    <link rel="icon" href="<?= base_url('assets/img/logo.jpg') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/css/app.css') ?>?v=18">
</head>
<body>
<?= $this->renderSection('content') ?>
<script type="module" src="<?= base_url('assets/js/app.js') ?>?v=18"></script>
</body>
</html>
