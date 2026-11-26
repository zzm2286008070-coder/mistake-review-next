import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('export the selected daily reminder without a cloud connection',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'canShare',{value:()=>false}));
 await page.goto('/#stats');
 await page.locator('summary').filter({hasText:'时间与通知设置'}).click();
 await page.getByLabel('每天',{exact:true}).fill('19:35');
 const pending=page.waitForEvent('download');
 await page.getByRole('button',{name:'添加到日历'}).click();
 const download=await pending;
 const contents=await readFile(await download.path(),'utf8');
 expect(contents).toMatch(/DTSTART:\d{8}T193500/);
 expect(contents).toContain('BEGIN:VALARM');
 await expect(page.getByRole('status').filter({hasText:'在系统日历中确认添加'})).toBeVisible();
});

test('finish and undo a review, then delete books with a recoverable snapshot',async({page})=>{
 const key='mistake_review_next_v4';
 const snapshot={
   version:4, books:[{id:'a',name:'练习册'},{id:'b',name:'误加的空书'}],
   probs:[{id:'p',bookId:'a',number:'1',next:'2020-01-01',created:'2020-01-01'}],
   positions:{a:{bookId:'a'},b:{bookId:'b'}}, last:{bookId:'a'}
 };
 await page.goto('/');
 await page.evaluate(([key,snapshot])=>localStorage.setItem(key,JSON.stringify(snapshot)),[key,snapshot]);
 await page.reload();
 await page.getByRole('link',{name:/今日复习/}).click();
 const quote=page.getByText('眼睛可以仰望星空，双脚必须脚踏实地。');
 await page.getByRole('button',{name:'做对了'}).click();
 await expect(quote).toBeVisible();
 await page.getByRole('button',{name:'撤销上一步'}).click();
 await expect(quote).toHaveCount(0);
 await page.getByRole('link',{name:/书本管理/}).click();
 const del=name=>page.locator('section.panel').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('button',{name:'删除书本'});
 page.once('dialog',d=>d.dismiss());
 await del('练习册').click();
 await expect(del('练习册')).toBeVisible();
 page.once('dialog',d=>d.accept());
 await del('误加的空书').click();
 await expect(del('误加的空书')).toHaveCount(0);
 page.once('dialog',d=>d.accept());
 await del('练习册').click();
 await expect(del('练习册')).toHaveCount(0);
 const [current,backup]=await page.evaluate(key=>[key,key+'_previous'].map(k=>JSON.parse(localStorage.getItem(k))),key);
 expect(current).toMatchObject({books:[],probs:[],positions:{},last:{}});
 expect(backup.books).toEqual([snapshot.books[0]]);
 expect(backup.probs[0]).toMatchObject(snapshot.probs[0]);
});
