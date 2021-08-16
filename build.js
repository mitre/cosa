/*
   Copyright 2021 The MITRE Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const path = require('path');
var fs = require('fs');


const CSS = [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css',
    'datatables.net-bs4/css/dataTables.bootstrap4.min.css',
    'datatables.net-dt/css/jquery.dataTables.min.css',
    'datatables.net-fixedcolumns-bs4/css/fixedColumns.bootstrap4.min.css',
    'datatables.net-jqui/css/dataTables.jqueryui.min.css',
    'daterangepicker/daterangepicker.css',
    'font-awesome/css/font-awesome.min.css',
    'icheck/skins/flat/blue.css',
    'icheck/skins/flat/blue.png',
    'icheck/skins/flat/blue@2x.png',
    'ionicons/dist/css/ionicons.min.css',
    'select2/dist/css/select2.min.css',
];
const FONT = [
    'font-awesome/fonts/fontawesome-webfont.eot',
    'font-awesome/fonts/fontawesome-webfont.svg',
    'font-awesome/fonts/fontawesome-webfont.ttf',
    'font-awesome/fonts/fontawesome-webfont.woff',
    'font-awesome/fonts/fontawesome-webfont.woff2',
    'font-awesome/fonts/FontAwesome.otf',
    'ionicons/dist/fonts/ionicons.eot',
    'ionicons/dist/fonts/ionicons.svg',
    'ionicons/dist/fonts/ionicons.ttf',
    'ionicons/dist/fonts/ionicons.woff',
    'ionicons/dist/fonts/ionicons.woff2',
];

const IMAGES = [
    'datatables.net-dt/images/sort_asc_disabled.png',
    'datatables.net-dt/images/sort_asc.png',
    'datatables.net-dt/images/sort_both.png',
    'datatables.net-dt/images/sort_desc_disabled.png',
    'datatables.net-dt/images/sort_desc.png',
];

const JS = [
    'bootstrap/dist/js/bootstrap.bundle.min.js',
    'bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
    'chart.js/dist/Chart.bundle.min.js',
    'fastclick/lib/fastclick.js',
    'datatables.net/js/jquery.dataTables.min.js',
    'datatables.net-bs4/js/dataTables.bootstrap4.min.js',
    'datatables.net-dt/js/dataTables.dataTables.min.js',
    'datatables.net-jqui/js/dataTables.jqueryui.min.js',
    'datatables.net-fixedcolumns-bs4/js/fixedColumns.bootstrap4.min.js',
    'daterangepicker/daterangepicker.js',
    'jquery/dist/jquery.min.js',    
    'jquery-form-validator/form-validator/jquery.form-validator.min.js',
    'jquery-form-validator/form-validator/security.js',
    'jquery-form-validator/form-validator/toggleDisabled.js',
    'jquery-knob/dist/jquery.knob.min.js',
    'jquery-slimscroll/jquery.slimscroll.min.js',
    'jquery-sparkline/jquery.sparkline.min.js',
    'jquery-validation/dist/jquery.validate.js',
    'multiselect-two-sides/dist/js/multiselect.min.js',
    'select2/dist/js/select2.min.js',
    'twitter-bootstrap-wizard/jquery.bootstrap.wizard.min.js'
];


if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
}

if (!fs.existsSync('./public/assets')) {
    fs.mkdirSync('./public/assets');
}

setTimeout(function () {
    if (!fs.existsSync('./public/assets/js')) {
        fs.mkdirSync('./public/assets/js');
    }
    if (!fs.existsSync('./public/assets/css')) {
        fs.mkdirSync('./public/assets/css');
    }
    if (!fs.existsSync('./public/assets/fonts')) {
        fs.mkdirSync('./public/assets/fonts');
    }
    if (!fs.existsSync('./public/assets/images')) {
        fs.mkdirSync('./public/assets/images');
    }
}, 1000);

setTimeout(function () {

    JS.map(asset => {
        let filename = asset.substring(asset.lastIndexOf("/") + 1);
        let from = path.resolve(__dirname, `./node_modules/${asset}`)
        let to = path.resolve(__dirname, `./public/assets/js/${filename}`)
        if (fs.existsSync(from)) {
            fs.createReadStream(from).pipe(fs.createWriteStream(to));
        } else {
            console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
            process.exit(1)
        }
    });

    CSS.map(asset => {
        let filename = asset.substring(asset.lastIndexOf("/") + 1);
        let from = path.resolve(__dirname, `./node_modules/${asset}`)
        let to = path.resolve(__dirname, `./public/assets/css/${filename}`)
        if (fs.existsSync(from)) {
            fs.createReadStream(from).pipe(fs.createWriteStream(to));
        } else {
            console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
            process.exit(1)
        }
    });

    FONT.map(asset => {
        let filename = asset.substring(asset.lastIndexOf("/") + 1);
        let from = path.resolve(__dirname, `./node_modules/${asset}`)
        let to = path.resolve(__dirname, `./public/assets/fonts/${filename}`)
        if (fs.existsSync(from)) {
            fs.createReadStream(from).pipe(fs.createWriteStream(to));
        } else {
            console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
            process.exit(1)
        }
    });

    IMAGES.map(asset => {
        let filename = asset.substring(asset.lastIndexOf("/") + 1);
        let from = path.resolve(__dirname, `./node_modules/${asset}`)
        let to = path.resolve(__dirname, `./public/assets/images/${filename}`)
        if (fs.existsSync(from)) {
            fs.createReadStream(from).pipe(fs.createWriteStream(to));
        } else {
            console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
            process.exit(1)
        }
    });

}, 3000)
