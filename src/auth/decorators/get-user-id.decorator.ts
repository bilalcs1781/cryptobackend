import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    if (user?.sub) {
      return String(user.sub);
    }
    
    if (user?._id) {
      return String(user._id);
    }
    
    throw new Error('User ID not found in request');
  },
);

