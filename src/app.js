const encodeFormated = require('./utils/util').encodeFormated;
const Promise = require('./utils/es6-promise');

App({
  data: {
    stuInfo: {
      name: '',
      college: '',
      stuNum: '',
      gender: '',
      major: '',
      grade: '',
      classNum: '',
      idNum: ''
    },
    userInfo: {
      avatar: '',
      city: '',
      country: ''
    }
  },
  /**
   * login 方法获取 code
   * 下一步交给 getSession 获取第三方 session
   */
  loginApp () {
    const self = this;
    return new Promise((resolve, reject) => {
      wx.login({
        success (res) {
          if (res.code) {
            console.log('code 获取成功');
            resolve(res.code);
          } else {
            console.log('获取用户登录态失败！' + res.errMsg);
          }
        },
        fail (err) {
          reject(err);
          // console.log(err);
        }
      });
    }).then(code => {
    /**
     * 获取第三方 session 并存储到本地
     * 到这里
     */
      return new Promise((resolve, reject) => {
        wx.request({
          method: 'post',
          url: 'https://redrock.cqupt.edu.cn/weapp/auth/codeAuth',
          data: {
            params: encodeFormated(code)
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success (res) {
            const retSession = res.data.bags.thirdSession;
            wx.setStorageSync('session', retSession);

            resolve();
          }
        });
      }).catch(err => {
        console.log(5555555, err);
      });
    }).catch(err => {
      console.log('登录app失败，继续', err);
      self.loginApp();
    });
  },
  getUserInfo () {
    const self = this;

    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success (res) {
          const { rawData, signature, encryptedData, iv } = res;
          const thirdSession = wx.getStorageSync('session');
          const obj = {
            infoStr: encodeFormated(`${rawData}&${signature}&${thirdSession}`),
            userStr: encodeFormated(`${encryptedData}&${iv}&${thirdSession}`)
          };

          resolve(obj);
        },
        fail () {
          console.log('获取 userInfo 失败, 继续');
          self.getUserInfo();
        }
      });
    }).then((obj) => {
      return new Promise((resolve, reject) => {
        wx.request({
          method: 'post',
          url: 'https://redrock.cqupt.edu.cn/weapp/auth/checkInfo',
          data: {
            params: obj.infoStr
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success (res) {
            if (res.data.status_code.toString() !== '200') {
              console.log('code 过期，需要重新获取');
              self.loginApp();
            } else {
              console.log('code 有效，可以继续使用');
              resolve(obj);
            }
          }
        });
      });
/**
 * 检查 userInfo
 * 返回新的 promise
 */
    }).then((obj) => {
      return new Promise((resolve, reject) => {
        wx.request({
          method: 'post',
          url: 'https://redrock.cqupt.edu.cn/weapp/auth/decryptData',
          data: {
            params: obj.userStr
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success (res) {
            if (res.statusCode.toString() !== '200') {
              self.getError();
              return;
            }
            const resData = res.data.bags;
            const info = {
              avatar: resData.avatarUrl,
              city: resData.city,
              country: resData.country
            };

            resolve(info);
          }
        });
      });
    }).then((info) => {
      for (let key in info) {
        self.data.userInfo[key] = info[key];
      }
    }).then(() => {
      return new Promise((resolve, reject) => {
        wx.request({
          method: 'post',
          url: 'https://redrock.cqupt.edu.cn/weapp/User/getUserInfo',
          data: {
            params: encodeFormated(wx.getStorageSync('session'))
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success (res) {
            if (res.statusCode.toString() !== '200') {
              // self.getError();
              return;
            }
            for (let key in res.data.bags) {
              self.data.stuInfo[key] = res.data.bags[key];
            }
            wx.setStorage({
              key: 'stuInfo',
              data: Object.assign(res.data.bags, self.data.userInfo)
            });
            // 获取学生信息
            resolve();
          }
        });
      });
    }).catch((err) => {
      throw new Error(err);
    });
  },
  getOpenId () {
    const self = this;
    const openIdUrl = 'https://redrock.cqupt.edu.cn/weapp/auth/getOpenid';

    wx.request({
      method: 'post',
      url: openIdUrl,
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        params: encodeFormated(wx.getStorageSync('session'))
      },
      success (res) {
        if (res.statusCode.toString() !== '200') {
          self.getError();
        }
      }
    });
  },

  onLaunch () {
    // 每次进入清空图书馆查询，电费查询清空缓存
    ['myinfor_library', 'rankList_library', 'myinfor_electricity'].forEach(key => {
      wx.removeStorage({
        key
      });
    });

    // 测试用
    if (wx.getStorageSync('cleared')) {
      return;
    }
    wx.request({
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      url: 'https://redrock.cqupt.edu.cn/weapp/bind/cancleBind',
      data: {
        params: encodeFormated(wx.getStorageSync('session'))
      },
      success: function (res) {
        if (!wx.getStorageSync('cleared')) {
          wx.clearStorage();
        }
      }
    });
  },
  gotoLogin (url) {
    wx.showModal({
      title: '请先登录',
      showCancel: true,
      confirmText: '确认',
      success: res => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  },
  getError () {
    wx.showModal({
      title: '网络错误',
      showCancel: false,
      confirmText: '确认',
      success: res => {
        if (res.confirm) {
          return false;
        }
      }
    });
  },
  removeStorages (key) {
    wx.removeStorage({
      key: key,
      success: res => {
        console.log('---------removestorage', wx.getStorage({
          key: key
        }));
      }
    });
  }
});
