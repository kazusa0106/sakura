var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');
var xlsx = require('node-xlsx');
var fs = require('fs');

//[year, area, kansho, type, kaika, kaika_cmp, mankai, mankai_cmp]
const res = [['年份', '地区', '观所', '樱花种类', '开花日期', '开花偏差值', '满开日期', '满开偏差值']];

//let year = 2017;
const firstUrl = '201701sakura.php';
const urlArr = [firstUrl];
const urlHasGot = [];

function getTypeName(type) {
    switch (type) {
        case 1: return '蝦夷山樱';
        case 2: return 'ヒカンザクラ';
        default: return '染井吉野';
    }
}

function getData(url, year) {
    // console.log(url, year);
    const base = `http://kishojin.weathermap.jp/topics/`;
    request(base + url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            urlHasGot.push(url);
            $ = cheerio.load(body);
            const tableArr = $('.area_name').parent();
            // console.log($(arr[0]).find("tr td").text());     
            tableArr.each(function () {
                const area = $(this).find('.area_name td').text();
                $(this).find("tr").each(function (index) {
                    if (index > 1) {
                        let kansho = $(this).find(".kansho_v").text();
                        let type = 0;
                        let kaika = $(this).find(".kaika_v").text();// 需修改成yyyy-mm-dd的格式
                        let kaika_cmp = $(this).find(".kaika_v_cmp").text();
                        let mankai = $(this).find(".mankai_v").text();
                        let mankai_cmp = $(this).find(".mankai_v_cmp").text();
                        if (kansho.endsWith('*')) {
                            kansho = kansho.substring(0, kansho.length - 1);
                            type = 1;
                        } else if (kansho.endsWith('+')) {
                            kansho = kansho.substring(0, kansho.length - 1);
                            type = 2
                        }

                        // res.push({
                        //     area: area,
                        //     kansho: kansho,
                        //     type: type,
                        //     kaika: kaika,
                        //     kaika_cmp: kaika_cmp,
                        //     mankai: mankai,
                        //     mankai_cmp: mankai_cmp,
                        //     year: year - 1,
                        // });
                        res.push([year, area, kansho, getTypeName(type), kaika, kaika_cmp, mankai, mankai_cmp]);
                    }
                });
            });
            const buffer = xlsx.build([
                {
                    name: 'sheet1',
                    data: res
                }
            ]);
            fs.writeFileSync('data.xlsx', buffer, { 'flag': 'w' });

            const reg = /^\d{6}sakura\.php$/;
            $("a").each(function () {
                if (reg.test($(this).prop("href"))) {
                    const href = $(this).prop("href");
                    if (urlArr.indexOf(href) < 0) {
                        urlArr.push(href);
                    }
                }
            });
            if (year === 2017) {
                urlArr.forEach((url) => {
                    const year = url.substring(0, 4);
                    if (year * 1 >= 2009 && urlHasGot.indexOf(url) < 0) {
                        getData(url, year * 1);
                    }
                });
            }
        }
    });
}


getData(firstUrl, 2017);


