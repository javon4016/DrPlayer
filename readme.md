```shell
yarn create vite
yarn add primevue primeicons
yarn add unplugin-vue-components
yarn add @primevue/auto-import-resolver
yarn add @primevue/themes
yarn add primeflex

yarn add vue-router
yarn add pinia

yarn remove primevue primeicons @primevue/auto-import-resolver primeflex @primevue/themes
yarn add --dev @arco-design/web-vue
yarn add json-server
yarn add axios
```
https://juejin.cn/post/7387581121519812617

[arco组件库](https://arco.design/vue/component/layout)

# 注意事项
package.json 需要注意 如果有 type:'module' 需要删除
json-server版本号只能 ^0.17.4,不然不支持middleware

# 图标全选加购
```javascript
var span = document.querySelectorAll('.icon-cover');
for (var i = 0, len = span.length; i < len; i++) {
     console.log(span[i].querySelector('span').click());
}

```

# 部署教程

https://juejin.cn/post/7301193497247727652

[解决vercel项目刷新404问题](https://juejin.cn/post/7358336719165554740)

# 我部署的demo

https://drplayer.playdreamer.cn/

https://hipy.playdreamer.cn/

# AI加量包购买

[点此访问](https://www.trae.ai/account-setting?purchase=1#usage)