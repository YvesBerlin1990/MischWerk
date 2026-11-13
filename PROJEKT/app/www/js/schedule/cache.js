/* Ein flüchtiger öffentlicher Tagesbestand innerhalb von drei Berliner Kalenderwochen. */
MischWerkUI.define('scheduleCache', function () {
  'use strict';
  var records = {}, days = [];
  function wall(stamp) {
    var year=new Date(stamp).getUTCFullYear();
    function change(month) { var last=new Date(Date.UTC(year,month+1,0)); return Date.UTC(year,month,last.getUTCDate()-last.getUTCDay(),1); }
    return stamp+(stamp>=change(2)&&stamp<change(9)?2:1)*3600000;
  }
  function day(date, offset) { return new Date(Date.parse(date + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0,10); }
  function validDate(value) { return typeof value==='string'&&/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value); }
  function today(stamp) { return new Date(wall(stamp)).toISOString().slice(0,10); }
  function first(today) { return day(today,-(new Date(today+'T12:00:00Z').getUTCDay()+6)%7-7); }
  function contains(date, today) { var start=first(today); return validDate(date)&&date>=start&&date<=day(start,20); }
  function present(data, stamp) {
    var current=today(stamp),previous=day(data.date,-1),next=day(data.date,1);
    return Object.assign({},data,{today:current,serverTime:stamp,clock:wall(stamp)/60000,
      previous:contains(previous,current)?previous:null,next:contains(next,current)?next:null});
  }
  function validPacket(value, date) {
    return value.source==='homepage'&&validDate(value.date)&&validDate(value.today)&&
      (date?value.date===date:value.date===value.today)&&typeof value.signature==='string'&&
      Number.isFinite(value.clock)&&Number.isFinite(value.serverTime)&&Number.isFinite(value.checkedAt);
  }
  function windowFor(today) {
    days = Array.from({length:21}, function (_, index) { return day(first(today),index); });
    Object.keys(records).forEach(function (key) { if (days.indexOf(key) === -1) { delete records[key]; } });
  }
  function save(value) {
    windowFor(value.today);
    if (!contains(value.date,value.today)) { return null; }
    var previous = records[value.date];
    if (value.unchanged) {
      if (!previous || previous.data.signature !== value.signature) { return null; }
      value = Object.assign({}, previous.data, value, { entries:previous.data.entries, unchanged:false, stale:false });
    }
    if (value.weekSignature) {
      Object.keys(records).forEach(function (key) {
        if (key !== value.date && records[key].data.week === value.week) {
          records[key].invalid = records[key].data.weekSignature !== value.weekSignature;
          if (!records[key].invalid) { records[key].data.checkedAt=value.checkedAt; }
        }
      });
    }
    records[value.date] = {data:value, invalid:value.stale===true, scroll:previous ? previous.scroll : null};
    return records[value.date];
  }
  function stale(record, now) {
    return !record || record.invalid || !Number.isFinite(record.data.checkedAt) || now < record.data.checkedAt || now-record.data.checkedAt >= 60000;
  }
  function invalidate(week) {
    Object.keys(records).forEach(function (key) {
      if (!week || Math.abs(Date.parse(records[key].data.week)-Date.parse(week)) <= 7*86400000) { records[key].invalid = true; }
    });
  }
  return {day:day, wall:wall, today:today, contains:contains, present:present, validDate:validDate, validPacket:validPacket,
    window:windowFor, get:function (date) { return records[date] || null; }, save:save, stale:stale,
    invalidate:invalidate, next:function (now) { return days.find(function (date) { return stale(records[date],now); }); },
    clear:function () { records={}; days=[]; }};
});
