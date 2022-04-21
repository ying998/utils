import { setDefalut, Axios } from "@/help";
import JSZip from "jszip";
import FileSaver from "file-saver";

/**
 * 单个文件参数
 * prefix:每个文件下载路径前缀
 * fileName:压缩文件名
 * suffix:压缩文件后缀
 */
interface DownLoadConfig {
  prefix?: string;
  fileName?: string;
  suffix?: string;
}
interface fileListConfig {
  fileUrl: string;
  name?: string;
}

const DEFAULT_VALUE = {
  fileName: `${new Date().getTime()}`,
  suffix: "zip",
};
//单个文件链接转化为文件流
function getFile(url) {
  return new Promise((resolve, reject) => {
    Axios({
      url,
      method: "get",
      responseType: "blob",
      withCredentials: true,
    })
      .then((res) => {
        resolve(res);
      })
      .catch((error) => {
        reject(error.toString());
      });
  });
}
export default function filesZip(
  fileList: Array<fileListConfig>,
  options: DownLoadConfig
) {
  const { prefix, fileName, suffix, ...config } = setDefalut(
    options,
    DEFAULT_VALUE
  );
  let zip = new JSZip();
  let promiseList = [];
  for (let item of fileList) {
    const url = prefix ? `${prefix}${item.fileUrl}` : item.fileUrl;
    const promise = getFile(url).then((res: any) => {
      // 下载文件, 并存成文件流对象
      const { headers, data } = res;
      let file_name = "";
      if (item["name"]) {
        file_name = `${new Date().getTime()}${item.name}`;
      } else {
        const disposition = headers.get("content-disposition");
        if (disposition && disposition.indexOf("attchement") !== -1) {
          let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          let matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            file_name = decodeURI(matches[1].replace(/['"]/g, ""));
          }
        } else {
          console.log("获取服务端返回的文件名失败");
        }
      }
      zip.file(file_name, data, { binary: true }); // 逐个添加文件
    });
    promiseList.push(promise);
  }

  return Promise.all(promiseList).then(() => {
    zip.generateAsync({ type: "blob" }).then((content) => {
      // 生成二进制流
      FileSaver.saveAs(content, `${fileName}.${suffix}`); // 利用file-saver保存文件  自定义文件名
    });
  });
}
