PGDMP     /    $                x           flux    12.3 (Debian 12.3-1.pgdg100+1)    12.2 )    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    16384    flux    DATABASE     t   CREATE DATABASE flux WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8';
    DROP DATABASE flux;
                flux    false            �            1259    16385    account_stake_in_outcome    TABLE     �   CREATE TABLE public.account_stake_in_outcome (
    account_id character varying(100) NOT NULL,
    market_id bigint NOT NULL,
    outcome bigint NOT NULL,
    stake numeric NOT NULL,
    round bigint NOT NULL
);
 ,   DROP TABLE public.account_stake_in_outcome;
       public         heap    flux    false            �            1259    16391    accounts    TABLE     i   CREATE TABLE public.accounts (
    id character varying(100) NOT NULL,
    affiliate_earnings numeric
);
    DROP TABLE public.accounts;
       public         heap    flux    false            �            1259    16397    claimable_if_valid    TABLE     �   CREATE TABLE public.claimable_if_valid (
    account_id character varying(100) NOT NULL,
    market_id bigint NOT NULL,
    claimable numeric NOT NULL
);
 &   DROP TABLE public.claimable_if_valid;
       public         heap    flux    false            �            1259    16415    markets    TABLE       CREATE TABLE public.markets (
    id bigint NOT NULL,
    description character varying(300) NOT NULL,
    extra_info character varying(500),
    creator character varying(100) NOT NULL,
    creation_date date NOT NULL,
    end_date_time timestamp without time zone NOT NULL,
    outcomes smallint NOT NULL,
    outcome_tags text[] NOT NULL,
    categories text[],
    winning_outcome smallint,
    resoluted boolean NOT NULL,
    resolute_bond numeric NOT NULL,
    filled_volume numeric NOT NULL,
    disputed boolean NOT NULL,
    finalized boolean NOT NULL,
    creator_fee_percentage smallint NOT NULL,
    resolution_fee_percentage smallint NOT NULL,
    affiliate_fee_percentage smallint NOT NULL,
    api_source text,
    validity_bond_claimed boolean NOT NULL
);
    DROP TABLE public.markets;
       public         heap    flux    false            �            1259    16427 
   orderbooks    TABLE     _   CREATE TABLE public.orderbooks (
    market_id bigint NOT NULL,
    outcome bigint NOT NULL
);
    DROP TABLE public.orderbooks;
       public         heap    flux    false            �            1259    24726    orders    TABLE     �  CREATE TABLE public.orders (
    id numeric NOT NULL,
    creator character varying NOT NULL,
    outcome bigint NOT NULL,
    market_id bigint NOT NULL,
    spend numeric NOT NULL,
    shares numeric NOT NULL,
    price numeric NOT NULL,
    filled numeric NOT NULL,
    shares_filled numeric NOT NULL,
    affiliate_account_id character varying,
    creation_time date NOT NULL,
    closed boolean NOT NULL
);
    DROP TABLE public.orders;
       public         heap    flux    false            �            1259    16522    protocol    TABLE     �   CREATE TABLE public.protocol (
    owner character varying(100) NOT NULL,
    creation_bond numeric NOT NULL,
    max_fee numeric NOT NULL
);
    DROP TABLE public.protocol;
       public         heap    flux    false            �            1259    16430    resolution_windows    TABLE     �   CREATE TABLE public.resolution_windows (
    market_id bigint NOT NULL,
    round bigint NOT NULL,
    bond_size numeric NOT NULL,
    end_time date NOT NULL,
    outcome bigint
);
 &   DROP TABLE public.resolution_windows;
       public         heap    flux    false            �            1259    16436    total_stake_in_outcomes    TABLE     �   CREATE TABLE public.total_stake_in_outcomes (
    market_id bigint NOT NULL,
    outcome bigint NOT NULL,
    round bigint NOT NULL,
    stake numeric NOT NULL
);
 +   DROP TABLE public.total_stake_in_outcomes;
       public         heap    flux    false            �          0    16385    account_stake_in_outcome 
   TABLE DATA           `   COPY public.account_stake_in_outcome (account_id, market_id, outcome, stake, round) FROM stdin;
    public          flux    false    202   �7       �          0    16391    accounts 
   TABLE DATA           :   COPY public.accounts (id, affiliate_earnings) FROM stdin;
    public          flux    false    203   8       �          0    16397    claimable_if_valid 
   TABLE DATA           N   COPY public.claimable_if_valid (account_id, market_id, claimable) FROM stdin;
    public          flux    false    204   >8       �          0    16415    markets 
   TABLE DATA           H  COPY public.markets (id, description, extra_info, creator, creation_date, end_date_time, outcomes, outcome_tags, categories, winning_outcome, resoluted, resolute_bond, filled_volume, disputed, finalized, creator_fee_percentage, resolution_fee_percentage, affiliate_fee_percentage, api_source, validity_bond_claimed) FROM stdin;
    public          flux    false    205   }8       �          0    16427 
   orderbooks 
   TABLE DATA           8   COPY public.orderbooks (market_id, outcome) FROM stdin;
    public          flux    false    206   �:       �          0    24726    orders 
   TABLE DATA           �   COPY public.orders (id, creator, outcome, market_id, spend, shares, price, filled, shares_filled, affiliate_account_id, creation_time, closed) FROM stdin;
    public          flux    false    210   �:       �          0    16522    protocol 
   TABLE DATA           A   COPY public.protocol (owner, creation_bond, max_fee) FROM stdin;
    public          flux    false    209   �;       �          0    16430    resolution_windows 
   TABLE DATA           \   COPY public.resolution_windows (market_id, round, bond_size, end_time, outcome) FROM stdin;
    public          flux    false    207   �;       �          0    16436    total_stake_in_outcomes 
   TABLE DATA           S   COPY public.total_stake_in_outcomes (market_id, outcome, round, stake) FROM stdin;
    public          flux    false    208   <                   2606    16443 6   account_stake_in_outcome account_stake_in_outcome_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.account_stake_in_outcome
    ADD CONSTRAINT account_stake_in_outcome_pkey PRIMARY KEY (account_id, market_id, outcome, round);
 `   ALTER TABLE ONLY public.account_stake_in_outcome DROP CONSTRAINT account_stake_in_outcome_pkey;
       public            flux    false    202    202    202    202                       2606    16445 *   claimable_if_valid claimable_if_valid_pkey 
   CONSTRAINT     {   ALTER TABLE ONLY public.claimable_if_valid
    ADD CONSTRAINT claimable_if_valid_pkey PRIMARY KEY (market_id, account_id);
 T   ALTER TABLE ONLY public.claimable_if_valid DROP CONSTRAINT claimable_if_valid_pkey;
       public            flux    false    204    204                       2606    16449    accounts markets_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);
 ?   ALTER TABLE ONLY public.accounts DROP CONSTRAINT markets_pkey;
       public            flux    false    203                       2606    16451    markets markets_pkey1 
   CONSTRAINT     S   ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey1 PRIMARY KEY (id);
 ?   ALTER TABLE ONLY public.markets DROP CONSTRAINT markets_pkey1;
       public            flux    false    205                       2606    16455    orderbooks orderbooks_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.orderbooks
    ADD CONSTRAINT orderbooks_pkey PRIMARY KEY (market_id, outcome);
 D   ALTER TABLE ONLY public.orderbooks DROP CONSTRAINT orderbooks_pkey;
       public            flux    false    206    206                       2606    24733    orders orders_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id, outcome, market_id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public            flux    false    210    210    210                       2606    16529    protocol protocol_data_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.protocol
    ADD CONSTRAINT protocol_data_pkey PRIMARY KEY (owner, creation_bond, max_fee);
 E   ALTER TABLE ONLY public.protocol DROP CONSTRAINT protocol_data_pkey;
       public            flux    false    209    209    209            
           2606    16459 *   resolution_windows resolution_windows_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public.resolution_windows
    ADD CONSTRAINT resolution_windows_pkey PRIMARY KEY (market_id, round);
 T   ALTER TABLE ONLY public.resolution_windows DROP CONSTRAINT resolution_windows_pkey;
       public            flux    false    207    207                       2606    16461 4   total_stake_in_outcomes total_stake_in_outcomes_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.total_stake_in_outcomes
    ADD CONSTRAINT total_stake_in_outcomes_pkey PRIMARY KEY (market_id, outcome, round);
 ^   ALTER TABLE ONLY public.total_stake_in_outcomes DROP CONSTRAINT total_stake_in_outcomes_pkey;
       public            flux    false    208    208    208                       2606    16462     markets accounts_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.markets
    ADD CONSTRAINT accounts_account_id_fkey FOREIGN KEY (creator) REFERENCES public.accounts(id) NOT VALID;
 J   ALTER TABLE ONLY public.markets DROP CONSTRAINT accounts_account_id_fkey;
       public          flux    false    2818    205    203                       2606    16467 #   claimable_if_valid accounts_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.claimable_if_valid
    ADD CONSTRAINT accounts_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) NOT VALID;
 M   ALTER TABLE ONLY public.claimable_if_valid DROP CONSTRAINT accounts_id_fkey;
       public          flux    false    2818    203    204                       2606    16477 )   account_stake_in_outcome accounts_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.account_stake_in_outcome
    ADD CONSTRAINT accounts_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);
 S   ALTER TABLE ONLY public.account_stake_in_outcome DROP CONSTRAINT accounts_id_fkey;
       public          flux    false    203    202    2818                       2606    24734    orders accounts_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT accounts_id_fkey FOREIGN KEY (creator) REFERENCES public.accounts(id) NOT VALID;
 A   ALTER TABLE ONLY public.orders DROP CONSTRAINT accounts_id_fkey;
       public          flux    false    2818    203    210                       2606    16482 "   resolution_windows markets_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.resolution_windows
    ADD CONSTRAINT markets_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);
 L   ALTER TABLE ONLY public.resolution_windows DROP CONSTRAINT markets_id_fkey;
       public          flux    false    205    2822    207                       2606    16487    orderbooks markets_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.orderbooks
    ADD CONSTRAINT markets_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);
 D   ALTER TABLE ONLY public.orderbooks DROP CONSTRAINT markets_id_fkey;
       public          flux    false    205    206    2822                       2606    16497 #   claimable_if_valid marketst_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.claimable_if_valid
    ADD CONSTRAINT marketst_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);
 M   ALTER TABLE ONLY public.claimable_if_valid DROP CONSTRAINT marketst_id_fkey;
       public          flux    false    205    204    2822                       2606    24739    orders orderbook_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orderbook_fkey FOREIGN KEY (outcome, market_id) REFERENCES public.orderbooks(outcome, market_id) NOT VALID;
 ?   ALTER TABLE ONLY public.orders DROP CONSTRAINT orderbook_fkey;
       public          flux    false    206    210    210    2824    206                       2606    16512 0   account_stake_in_outcome resolution_windows_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.account_stake_in_outcome
    ADD CONSTRAINT resolution_windows_fkey FOREIGN KEY (market_id, round) REFERENCES public.resolution_windows(market_id, round);
 Z   ALTER TABLE ONLY public.account_stake_in_outcome DROP CONSTRAINT resolution_windows_fkey;
       public          flux    false    2826    207    207    202    202                       2606    16517 /   total_stake_in_outcomes resolution_windows_pkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.total_stake_in_outcomes
    ADD CONSTRAINT resolution_windows_pkey FOREIGN KEY (market_id, round) REFERENCES public.resolution_windows(market_id, round);
 Y   ALTER TABLE ONLY public.total_stake_in_outcomes DROP CONSTRAINT resolution_windows_pkey;
       public          flux    false    208    207    208    2826    207            �   :   x�K�)��MI-�4�4�45� �\i0%&������TR�Z\Ub�i��(����� `��      �      x�K�)��MI-�4�*I-.�2c���� {��      �   /   x�K�)��MI-�4�4�J�q�9F@NIjq	\�c��)����� �@�      �     x���M��0�����'i���qZ�e/N<m;돲b���q�+�G���g�)"�(�;��� ��!P5`,�w6`1&J�H�'{ 4ć5_ ��!�0�e�=i��FH��8<`�B#�`(CwI��1Z86�������D��'x����"9�5�n���(P�tI#;*��Mp�X�.�T)"�OL2�J<��h5z.�7NΤ��!�p��! �d�O����t �f �7�~��$jY˅\/�&��B�Rn�K��sn,:��Q<�<��b/Z��#$��E�o+�^�J|b�9������2r<"������*���A5:����,�Z�Y�1��݁��+��_0�'Z=ɲ��X�q]�Vyg���Ż{����Y���� �@��{y�_��/�T�����	��	r���mՔͦY�/���y1�3艼2��\^pN�]�^Y�0��C}%ٲ)庮����� ��b�.-��Y���!�_J_C�6�jUn�i��N{[�f����d�      �   3   x���	 0��w�����M��#A�8�8��i��&
�Q��+4�zW��      �   �   x�œM� F�p�$��)<�Ku�R;����0X؅�{3���FS7/�}��(b�ު��<���C�Eơ,�CV�p��@��.L���0�ot�.w0CKW?w�W�k�C���S����0���0+	s�a��M�*�3�7�ߝ�P��B�Ic%J�VeZ�7h��L      �       x�K�)��MI-�425@�"\1z\\\ U$
�      �   >   x�3�4�44��FF�溆f�1~\Ɯ���Up�VdTD���ĘeJ�Y\1z\\\ =E'�      �   &   x�3�4 BS�e�i�C���P�Sƀ+F��� �o     