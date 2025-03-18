
import Header from "../Header";
import { useMenuHandlers } from "../../hooks/useMenuHandlers";
import styles from "./index.module.css";

function Gnb() {
  const { setSubMenus } = useMenuHandlers();

  return (
    <>
    <nav className={styles.nav}>
      <ul>
        <li>채용공고</li>
        <li>원픽</li>
        <li>하이테크</li>
        <li>공채정보</li>
        <li>헤드헌팅</li>
        <li>기업연봉</li>
        <li>커리어</li>
        <li>취업톡톡</li>
      </ul>
    </nav>
    <Header setSubMenus={setSubMenus} />
    </>
  );
}

export default Gnb;
