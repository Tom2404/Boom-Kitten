import { animationManager } from './AnimationManager';
import { VFXFactory } from './VFXFactory';

/**
 * Mảng chứa tất cả tên các loại bài cơ bản (Original) và mở rộng
 * Chúng ta sẽ duyệt mảng này để register tự động thay vì viết tay từng cái.
 */
const ALL_CARD_TYPES = [
  'ATTACK_2X', 'TARGET_ATTACK', 'PERSONAL_ATTACK',
  'SKIP', 'SUPER_SKIP', 'REVERSE',
  'SHUFFLE', 'NOPE',
  'SEE_THE_FUTURE_3X', 'SEE_THE_FUTURE_5X', 'ALTER_THE_FUTURE_3X',
  'FAVOR', 'I_LL_TAKE_THAT',
  'NORMAL_CAT', 'DRAW_BOTTOM', 'BURY', 'POTLUCK', 'GARBAGE_COLLECTION'
];

/**
 * Tự động quét và đăng ký (Register) các hoạt ảnh lá bài vào AnimationManager
 */
export const registerCardAnimations = () => {
  
  // 1. Đăng ký hàng loạt các lá bài thao tác thông thường qua Factory
  ALL_CARD_TYPES.forEach(cardType => {
    animationManager.register(`CARD_${cardType}`, (event, vfxManager) => {
      // Đóng gói dữ liệu gửi cho Factory
      const cardData = { type: cardType };
      return VFXFactory.createAnimation(vfxManager, cardData, event.metadata);
    });
  });

  // 2. Đăng ký các lá bài mang tính sự kiện sinh tử (Ultimate Priority)
  
  // Bom nổ
  animationManager.register('CARD_EXPLODING_KITTEN', (event, vfxManager) => {
    return VFXFactory.createExplodingKitten(vfxManager, event.metadata);
  });

  // Gỡ bom
  animationManager.register('CARD_DEFUSE', (event, vfxManager) => {
    return VFXFactory.createDefuse(vfxManager, event.metadata);
  });
  
  // Các lá bài Ultimate khác (Godcat, Armageddon) có thể đăng ký bổ sung ở đây
};

// Gọi ngay khi import
registerCardAnimations();
