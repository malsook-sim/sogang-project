import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "서비스 이용약관 · 마이보이스스토리 for 키즈",
};

export default function TermsPage() {
  return (
    <LegalDoc title="서비스 이용약관" updatedAt="2026년 7월 13일">
      <LegalSection heading="제1조 (목적)">
        <p>
          본 약관은 마이보이스스토리 for 키즈(이하 “서비스”)가 제공하는 보호자
          음성 기반 동화 낭독 서비스의 이용 조건과 절차, 이용자와 서비스의 권리·
          의무 및 책임 사항을 규정하는 것을 목적으로 합니다.
        </p>
      </LegalSection>

      <LegalSection heading="제2조 (이용 계약의 성립)">
        <p>
          이용자는 본 약관과 개인정보 처리방침에 동의하고 회원가입을 완료함으로써
          서비스 이용 계약을 체결합니다. 만 14세 미만 아동의 정보는 보호자(법정
          대리인)의 관리 하에 입력·이용됨을 전제로 합니다.
        </p>
      </LegalSection>

      <LegalSection heading="제3조 (음성 데이터의 이용)">
        <p>
          이용자가 등록한 목소리는 동화 낭독 음성을 생성하기 위한 목적으로만
          사용되며, 이용자의 동의 없이 제3자에게 제공되거나 다른 목적으로 사용되지
          않습니다. 이용자는 언제든지 등록한 목소리를 삭제할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="제4조 (이용자의 의무)">
        <p>
          이용자는 본인 또는 정당한 동의를 받은 사람의 목소리만 등록해야 하며,
          타인의 목소리를 무단으로 복제·이용해서는 안 됩니다. 서비스로 생성한
          콘텐츠를 불법적이거나 타인의 권리를 침해하는 용도로 사용할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection heading="제5조 (서비스의 변경 및 중단)">
        <p>
          서비스는 운영상·기술상 필요에 따라 제공 내용을 변경하거나 중단할 수
          있으며, 이 경우 사전에 공지하도록 노력합니다.
        </p>
      </LegalSection>

      <LegalSection heading="제6조 (책임의 제한)">
        <p>
          서비스는 AI로 생성된 동화 및 음성의 정확성·적합성을 보증하지 않으며,
          생성 콘텐츠는 참고용입니다. 천재지변, 이용자의 귀책 등 서비스의 합리적
          통제 범위를 벗어난 사유로 인한 손해에 대해서는 책임을 지지 않습니다.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
