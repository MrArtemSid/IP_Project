<body>
<div id="container" class="container">
    <?php
    $page = "content.html";
    include_once ('menu.php');
    ?>
    <div class="content">
        <?php
        include_once ($page);
        ?>
    </div>
</div>
</body>
