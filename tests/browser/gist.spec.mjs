import {test, expect} from '@playwright/test';

test('remember authorization across fresh tabs and clear it on disconnect', async ({page,context}) => {
  const fixture='persistent-test-fixture';
  const key='mistake_review_next_cloud_v1';
  let requests=0;
  await context.route('https://api.github.com/**',async route=>{
    requests++;
    expect(route.request().headers().authorization === 'Bearer '+fixture).toBe(true);
    await route.fulfill({json:{id:'abcde',files:{}}});
  });
  await page.goto('/#stats');
  await page.locator('summary').filter({hasText:'云同步'}).click();
  await page.getByLabel(/GitHub Token/).fill(fixture);
  await page.getByLabel(/现有 Gist ID/).fill('abcde');
  await page.getByRole('button',{name:'连接现有 Gist'}).click();
  await expect(page.getByText('已连接 Gist · 本机已保存授权')).toBeVisible();
  const fresh=await context.newPage();
  await page.close();
  await fresh.goto('/#stats');
  await fresh.locator('summary').filter({hasText:'云同步'}).click();
  await expect(fresh.getByText('已连接 Gist · 本机已保存授权')).toBeVisible();
  await expect(fresh.getByLabel(/GitHub Token/)).toHaveValue('');
  await fresh.getByRole('button',{name:'连接现有 Gist'}).click();
  expect(requests).toBe(2);
  expect(await fresh.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key))).includes('persistent-test-fixture'),key)).toBe(false);
  await fresh.getByRole('button',{name:'断开',exact:true}).click();
  expect(await fresh.evaluate(key=>localStorage.getItem(key+'_token')===null&&sessionStorage.getItem(key+'_token')===null,key)).toBe(true);
  await expect(fresh.getByText('尚未连接云端',{exact:true})).toBeVisible();
});

test('migrate the previous session authorization to this device',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    sessionStorage.setItem('mistake_review_next_cloud_v1_token','migration-test-fixture');
    localStorage.setItem('mistake_review_next_cloud_v1',JSON.stringify({gistId:'abcde'}));
  });
  await page.reload();
  expect(await page.evaluate(()=>localStorage.getItem('mistake_review_next_cloud_v1_token')==='migration-test-fixture')).toBe(true);
  expect(await page.evaluate(()=>sessionStorage.getItem('mistake_review_next_cloud_v1_token')===null)).toBe(true);
});

test('connect, download, upload, and create a secret backup through the WebKit UI', async ({page}) => {
  const existing = 'ab123', created = 'cd456', filename = 'mistake-review-next.json';
  const book = {id: 'book', name: '测试用书'};
  const problem = {id: 'p', bookId: 'book', number: '7', created: '2026-11-26', hist: [{date:'2026-11-26', result:'correct'}]};
  const snapshot = {books:[book], probs:[problem]};
  const gist = {id: existing, files:{'mistake-review.json':{content:JSON.stringify(snapshot)}}};
  const calls = [];
  const writes = [];
  const fixtureToken = 'browser-test-fixture';
  await page.route('https://api.github.com/**', async route => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    calls.push([method,path]);
    expect(request.headers().authorization === 'Bearer ' + fixtureToken).toBe(true);
    if (method === 'GET') return route.fulfill({json:gist});
    const body = request.postDataJSON();
    expect(JSON.stringify(body).includes(fixtureToken)).toBe(false);
    writes.push(body);
    await route.fulfill({status:method === 'POST' ? 201 : 200, json:{id:method === 'POST' ? created : existing}});
  });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/#stats');
  await page.locator('summary').filter({hasText:'云同步'}).click();
  await page.getByLabel(/GitHub Token/).fill(fixtureToken);
  await page.getByLabel(/现有 Gist ID/).fill(existing);
  await page.getByRole('button',{name:'连接现有 Gist'}).click();
  await page.getByRole('button',{name:'从云端下载'}).click();
  await expect(page.getByRole('dialog')).toContainText('1 本书、1 道题');
  await page.getByRole('button',{name:'合并到本机'}).click();
  await expect(page.locator('main')).toContainText(book.name);
  await page.locator('summary').filter({hasText:'云同步'}).click();
  await page.getByRole('button',{name:'上传到云端'}).click();
  await expect(page.locator('#toast')).toContainText('已上传到云端');
  await page.getByRole('button',{name:'新建云端备份'}).click();
  await expect(page.locator('#cloudCards code')).toHaveText(created);
  expect(calls).toEqual([['GET','/gists/'+existing],['GET','/gists/'+existing],['PATCH','/gists/'+existing],['POST','/gists']]);
  expect(writes[1].public).toBe(false);
  for (const write of writes) {
    expect(Object.keys(write.files)).toEqual([filename]);
    const saved = JSON.parse(write.files[filename].content);
    expect(saved.books).toEqual(snapshot.books);
    expect(saved.probs).toHaveLength(1);
    expect(saved.probs[0]).toMatchObject(problem);
  }
});
